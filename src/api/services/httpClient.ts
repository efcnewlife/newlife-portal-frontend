// HTTP client service based on axios
import { API_ENDPOINTS, REQUEST_CONFIG } from "@/api";
import i18n from "@/i18n";
import type { ApiError, ApiResponse, TokenResponse } from "@/types/api";
import { notificationManager } from "@/utils/notificationManager";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, HttpStatusCode } from "axios";

// Interceptor types
type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

// HTTP client class
class HttpClient {
  private axiosInstance: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: REQUEST_CONFIG.BASE_URL,
      timeout: REQUEST_CONFIG.TIMEOUT,
      headers: REQUEST_CONFIG.HEADERS,
    });

    // Set up default interceptors
    this.setupDefaultInterceptors();
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // Execute request interceptors
  private async executeRequestInterceptors(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    return finalConfig;
  }

  // Execute response interceptors
  private async executeResponseInterceptors(response: AxiosResponse): Promise<AxiosResponse> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  // Execute error interceptors
  private async executeErrorInterceptors(error: ApiError): Promise<ApiError> {
    let finalError = error;
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError);
    }
    return finalError;
  }

  // Handle errors
  // - Network-level errors (timeout / no response) show notifications here.
  // - Errors with HTTP status are converted to ApiError and handled by service layers.
  private handleError(error: AxiosError): ApiError {
    if (error.code === "ECONNABORTED") {
      const apiError: ApiError = {
        code: HttpStatusCode.RequestTimeout,
        message: i18n.t("errors.timeout"),
      };
      notificationManager.show({
        variant: "error",
        title: i18n.t("errors.timeout"),
        description: i18n.t("errors.timeout"),
        position: "top-right",
      });
      return apiError;
    }

    // Check whether HTTP response exists (normal case)
    if (error.response) {
      const status = error.response.status;
      const response_data = error.response.data as { detail?: string; debug_detail?: unknown; url?: string; message?: string } | undefined;

      // Prefer backend detail as message; fallback to message or default error text
      const backend_detail = response_data?.detail;
      const fallback_message = response_data?.message;
      const message = (typeof backend_detail === "string" && backend_detail) || fallback_message || this.getErrorMessage(status);

      const apiError: ApiError = {
        code: status,
        message,
        details: {
          detail: backend_detail,
          debug_detail: response_data?.debug_detail,
          url: response_data?.url,
          // Keep original data for debugging (if extra fields exist)
          ...response_data,
        },
      };
      return apiError;
    }

    // No complete response object, but status code may still be present
    // Check whether error object has status property (special cases after interceptor mutations)
    const errorWithStatus = error as AxiosError & { status?: number };
    if (errorWithStatus.status && typeof errorWithStatus.status === "number") {
      const status = errorWithStatus.status;
      const apiError: ApiError = {
        code: status,
        message: this.getErrorMessage(status),
      };
      return apiError;
    }

    // True network-level error (no HTTP status info at all)
    const apiError: ApiError = {
      code: 0,
      message: i18n.t("errors.network"),
    };
    notificationManager.show({
      variant: "error",
      title: i18n.t("errors.network"),
      description: i18n.t("errors.network"),
      position: "top-right",
    });
    return apiError;
  }

  // Get error message by status code
  private getErrorMessage(status: number): string {
    switch (status) {
      case HttpStatusCode.Unauthorized:
        return i18n.t("errors.unauthorized");
      case HttpStatusCode.Forbidden:
        return i18n.t("errors.forbidden");
      case HttpStatusCode.NotFound:
        return i18n.t("errors.notFound");
      case HttpStatusCode.InternalServerError:
        return i18n.t("errors.server");
      default:
        return i18n.t("errors.unknown");
    }
  }

  // Retry mechanism
  private async retryRequest(config: AxiosRequestConfig, attempt: number = 1): Promise<AxiosResponse> {
    try {
      return await this.axiosInstance.request(config);
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const isTimeout = axiosError.code === "ECONNABORTED";
      const isNetworkError = !axiosError.response;

      // Retry only for network/timeout/5xx; do not retry 4xx (e.g. 401/403/404)
      const shouldRetry = isNetworkError || isTimeout || (typeof status === "number" && status >= 500);

      if (shouldRetry && attempt < REQUEST_CONFIG.RETRY_ATTEMPTS) {
        await this.delay(REQUEST_CONFIG.RETRY_DELAY);
        return this.retryRequest(config, attempt + 1);
      }
      throw error;
    }
  }

  // Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generic request method
  async request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const processedConfig = await this.executeRequestInterceptors(config);
      const response = await this.retryRequest(processedConfig);
      const processedResponse = await this.executeResponseInterceptors(response);

      return {
        success: true,
        data: processedResponse.data,
        code: processedResponse.status,
      };
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);

      // On 401, try refreshing access token and retry once
      // Login requests should not trigger refresh token logic
      if (apiError.code === HttpStatusCode.Unauthorized && !this.isRefreshRequest(config) && !this.isLoginRequest(config)) {
        try {
          await this.getOrCreateRefreshPromise();

          // Retry original request after successful refresh (with new Authorization header)
          const retriedConfig = await this.executeRequestInterceptors(config);
          const retriedResponse = await this.retryRequest(retriedConfig);
          const processedRetryResponse = await this.executeResponseInterceptors(retriedResponse);

          return {
            success: true,
            data: processedRetryResponse.data,
            code: processedRetryResponse.status,
          };
        } catch (retryError) {
          // If refresh/retry still fails, throw error for service-layer handling
          // Check whether error is already an ApiError
          let finalError: ApiError;
          if (retryError && typeof retryError === "object" && "code" in retryError && typeof (retryError as ApiError).code === "number") {
            finalError = retryError as ApiError;
          } else {
            finalError = this.handleError(retryError as AxiosError);
          }
          const processedFinalError = await this.executeErrorInterceptors(finalError);
          throw processedFinalError;
        }
      }

      const processedError = await this.executeErrorInterceptors(apiError);
      throw processedError;
    }
  }

  // GET request
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "GET",
      url,
      params,
    });
  }

  // POST request
  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data,
    });
  }

  // PUT request
  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PUT",
      url,
      data,
    });
  }

  // PATCH request
  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PATCH",
      url,
      data,
    });
  }

  // DELETE request (supports body)
  async delete<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "DELETE",
      url,
      data,
    });
  }

  // File upload
  async upload<T = unknown>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<T>({
      method: "POST",
      url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Set up default interceptors
  private setupDefaultInterceptors(): void {
    // Default request interceptor - add auth token
    this.addRequestInterceptor(async (config) => {
      // Get token from authService; it chooses storage based on rememberMe
      const token = this.getTokenFromStorage();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });

    // Default response interceptor - handle auth expiration
    this.addResponseInterceptor(async (response) => {
      return response;
    });

    // Default error interceptor - log errors
    this.addErrorInterceptor(async (error) => {
      console.error("API Error:", error);
      return error;
    });
  }

  // Check whether this is a refresh token request
  private isRefreshRequest(config: AxiosRequestConfig): boolean {
    const url = typeof config.url === "string" ? config.url : "";
    return url === API_ENDPOINTS.AUTH.REFRESH;
  }

  // Check whether this is a login request
  private isLoginRequest(config: AxiosRequestConfig): boolean {
    const url = typeof config.url === "string" ? config.url : "";
    return url === API_ENDPOINTS.AUTH.LOGIN || url === API_ENDPOINTS.AUTH.MICROSOFT;
  }

  // Create or reuse refresh flow promise (avoid parallel duplicate refresh)
  private async getOrCreateRefreshPromise(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.refreshAccessToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // Call backend to exchange refresh token for a new access token
  private async refreshAccessToken(): Promise<string> {
    // Only remember-me mode stores refresh token
    const storedRefreshToken = localStorage.getItem("refresh_token");

    if (!storedRefreshToken) {
      throw {
        code: HttpStatusCode.Unauthorized,
        message: "No refresh token available",
      } as ApiError;
    }

    // Use axiosInstance directly to call refresh endpoint without Authorization header
    try {
      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH, {
        refresh_token: storedRefreshToken,
      });

      const data = response.data as TokenResponse;
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;

      if (!newAccessToken) {
        throw {
          code: HttpStatusCode.Unauthorized,
          message: "Failed to refresh access token",
        } as ApiError;
      }

      // Store new access token (remember-me mode)
      localStorage.setItem("auth_token", newAccessToken);

      // Store new refresh token if provided
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }

      return newAccessToken;
    } catch (error) {
      // Convert refresh API failures (e.g. 401) into ApiError
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const status = axiosError.response.status;
          const response_data = axiosError.response.data as
            | { detail?: string; debug_detail?: unknown; url?: string; message?: string }
            | undefined;
          const backend_detail = response_data?.detail;
          const fallback_message = response_data?.message;
          const message = (typeof backend_detail === "string" && backend_detail) || fallback_message || this.getErrorMessage(status);

          throw {
            code: status,
            message,
            details: {
              detail: backend_detail,
              debug_detail: response_data?.debug_detail,
              url: response_data?.url,
              ...response_data,
            },
          } as ApiError;
        }
      }
      // Re-throw other errors directly
      throw error;
    }
  }

  // Get token from storage (supports rememberMe)
  private getTokenFromStorage(): string | null {
    // Check sessionStorage first (normal login mode has priority)
    const sessionToken = sessionStorage.getItem("auth_token");
    if (sessionToken) return sessionToken;

    // Then check localStorage (remember-me mode)
    return localStorage.getItem("auth_token");
  }
}

// Create global HTTP client instance
export const httpClient = new HttpClient();

export default httpClient;
