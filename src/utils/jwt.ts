export interface JWTPayload {
  sub: string;
  exp: number;
  aud: string;
  iat: number;
  iss: string;
  user_id: string;
  email: string;
  display_name: string;
  roles?: string[];
  scope?: string[] | string; // OAuth 2.0 scope（May be an array or space-separated string)
  family_id: string;
}

/**
 * parse JWT Token（Does not verify signature, only used for reading payload）
 * Note: The front-end parsing does not verify the signature, the real verification is done by the back-end
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * from JWT Token obtain scope（permissions)
 * deal with scope It may be a string (space separated) or an array
 */
export function getScopesFromToken(token: string | null): string[] {
  if (!token) return [];

  const payload = parseJWT(token);
  if (!payload || !payload.scope) return [];

  // deal with scope May be a string (space separated) or an array
  if (Array.isArray(payload.scope)) {
    return payload.scope;
  } else if (typeof payload.scope === 'string') {
    return payload.scope.split(' ').filter(Boolean);
  }

  return [];
}

/**
 * from JWT Token obtain roles
 */
export function getRolesFromToken(token: string | null): string[] {
  if (!token) return [];

  const payload = parseJWT(token);
  return payload?.roles || [];
}

/**
 * examine JWT Token Is it expired?
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Check if permissions are in scope in list
 * Supports wildcard matching: if scope There is "resource:*"，Then all operations on the resource are deemed to have permissions
 * 
 * @param permission The permissions to check, in the format "resource:verb"，For example "system:user:read"
 * @param scopes scope list, which may contain "resource:*" or specific "resource:verb"
 * @returns If you have permission to return true，Otherwise return false
 * 
 * @example
 * // exact match
 * hasPermissionInScopes("system:user:read", ["system:user:read"]) // true
 * 
 * // wildcard matching
 * hasPermissionInScopes("system:user:read", ["system:user:*"]) // true
 * hasPermissionInScopes("system:user:create", ["system:user:*"]) // true
 * 
 * // does not match
 * hasPermissionInScopes("system:user:read", ["system:role:read"]) // false
 */
export function hasPermissionInScopes(permission: string, scopes: string[]): boolean {
  // Check for exact match first
  if (scopes.includes(permission)) {
    return true;
  }

  // Check for wildcard matches
  // permission The format should be "resource:verb"，For example "system:user:read"
  const parts = permission.split(':');
  if (parts.length >= 2) {
    // extract resource parts (all but the last part are resource）
    const resource = parts.slice(0, -1).join(':');
    const wildcardScope = `${resource}:*`;
    
    // if scope There is "resource:*"，Then all operations on the resource have permissions
    if (scopes.includes(wildcardScope)) {
      return true;
    }
  }

  return false;
}

