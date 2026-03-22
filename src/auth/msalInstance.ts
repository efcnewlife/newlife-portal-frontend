import { ENV_CONFIG, IS_MICROSOFT_LOGIN_ENABLED } from "@/config/env";
import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

/**
 * Scopes requested at interactive sign-in. Must match delegated API permissions on the Entra app registration.
 * Graph scopes (User.Read, User.Read.All) use short form with the v2 authority.
 */
export const MSAL_LOGIN_SCOPES: string[] = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "User.Read.All",
];

let msal_instance: PublicClientApplication | null = null;

function build_config(): Configuration | null {
  if (!IS_MICROSOFT_LOGIN_ENABLED) {
    return null;
  }
  const redirect_uri = ENV_CONFIG.AZURE_REDIRECT_URI?.trim() || `${window.location.origin}`;
  return {
    auth: {
      clientId: ENV_CONFIG.AZURE_CLIENT_ID.trim(),
      authority: `https://login.microsoftonline.com/${ENV_CONFIG.AZURE_TENANT_ID.trim()}`,
      redirectUri: redirect_uri,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };
}

/**
 * Lazily create the MSAL public client when Entra env vars are present.
 */
export function get_msal_instance(): PublicClientApplication | null {
  if (!IS_MICROSOFT_LOGIN_ENABLED) {
    return null;
  }
  if (!msal_instance) {
    const config = build_config();
    if (!config) {
      return null;
    }
    msal_instance = new PublicClientApplication(config);
  }
  return msal_instance;
}

export async function ensure_msal_ready(): Promise<PublicClientApplication | null> {
  const app = get_msal_instance();
  if (!app) {
    return null;
  }
  await app.initialize();
  return app;
}
