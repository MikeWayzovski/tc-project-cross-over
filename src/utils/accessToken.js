import { Logger } from './logger';

export class TokenUnavailableError extends Error {
  constructor(message = 'Geen geldig token beschikbaar.') {
    super(message);
    this.name = 'TokenUnavailableError';
    this.code = 'NO_TOKEN';
  }
}

export const isTokenUnavailable = (error) =>
  error instanceof TokenUnavailableError || error?.code === 'NO_TOKEN';

/**
 * Leest een token dat al in deze sessie is gezet, of vraagt er een via Trimble ID.
 * Gooit nooit: ontbreekt het token, dan komt er null terug.
 */
export const readStoredToken = async (getAccessTokenSilently) => {
  if (window.trimbleSandboxToken) return window.trimbleSandboxToken;
  if (typeof getAccessTokenSilently !== 'function') return null;

  try {
    const token = await getAccessTokenSilently();
    if (token) window.trimbleSandboxToken = token;
    return token || null;
  } catch (error) {
    Logger.warn('OAuth-token kon niet worden opgehaald:', error.message || error);
    return null;
  }
};

/**
 * 1. Geldige PKCE / Trimble ID access token
 * 2. Trimble Connect Workspace-token (iframe)
 * 3. Anders TokenUnavailableError — aanroeper toont inloggen, geen uncaught exception.
 */
export const resolveAccessToken = async ({
  isAuthenticated,
  getAccessTokenSilently,
  isEmbedded,
  embeddedToken,
  workspaceApi,
}) => {
  if (isAuthenticated && typeof getAccessTokenSilently === 'function') {
    try {
      const oauthToken = await getAccessTokenSilently();
      if (oauthToken) {
        window.trimbleSandboxToken = oauthToken;
        return oauthToken;
      }
    } catch (error) {
      Logger.warn('OAuth-token verlopen of ontbreekt, Workspace-token proberen:', error.message || error);
    }
  }

  if (embeddedToken) {
    window.trimbleSandboxToken = embeddedToken;
    return embeddedToken;
  }

  if (isEmbedded && workspaceApi?.extension?.getPermission) {
    try {
      const workspaceToken = await workspaceApi.extension.getPermission('accesstoken');
      if (workspaceToken) {
        window.trimbleSandboxToken = workspaceToken;
        return workspaceToken;
      }
    } catch (error) {
      Logger.warn('Workspace-token kon niet worden opgehaald:', error.message || error);
    }
  }

  if (window.trimbleSandboxToken) return window.trimbleSandboxToken;

  throw new TokenUnavailableError();
};
