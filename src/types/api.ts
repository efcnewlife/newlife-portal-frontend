// Common API type definitions

// Base API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface BackendErrorDetail {
  detail?: string;
  debug_detail?: unknown;
  url?: string;
  [key: string]: unknown;
}

export interface ApiError {
  code: number;
  message: string;
  details?: BackendErrorDetail;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
}

export interface QueryParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface FileUpload {
  file: File;
  progress?: number;
  status: "pending" | "uploading" | "success" | "error";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionResource {
  id: string;
  name: string;
  key: string;
  code: string;
}

export interface PermissionVerb {
  id: string;
  displayName: string;
  action: string;
}

interface PermissionBase {
  id: string;
  displayName: string;
  code: string;
  isActive: boolean;
  description?: string;
  remark?: string;
}

export interface PermissionListItem extends PermissionBase {
  resourceId: string;
  verbId: string;
}

export interface PermissionDetail extends PermissionBase {
  resource: PermissionResource;
  verb: PermissionVerb;
}

export interface PermissionPageItem extends Record<string, unknown> {
  id: string;
  displayName: string;
  code: string;
  isActive: boolean;
  description?: string;
  remark?: string;
  resourceName: string;
  verbName: string;
}

export interface PermissionPage {
  page: number;
  page_size: number;
  total: number;
  items: PermissionPageItem[];
}

export interface PermissionCreate {
  displayName: string;
  code: string;
  resourceId: string;
  verbId: string;
  isActive: boolean;
  description?: string;
  remark?: string;
}

export interface PermissionUpdate extends PermissionCreate {}

export interface PermissionDelete {
  reason?: string;
  permanent?: boolean;
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  type: "module" | "resource" | "action";
  level: number;
  permissions?: string[];
  children?: Resource[];
}

export interface ResourceGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: Resource[];
}

export interface Conference {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  maxParticipants: number;
  currentParticipants: number;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  instructors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  resource: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DashboardStats {
  totalResources: number;
  totalRoles: number;
  totalPermissions: number;
  totalConferences: number;
  systemHealth: "healthy" | "warning" | "critical";
  lastUpdated: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}
