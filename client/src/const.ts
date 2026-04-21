export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Development mode flag - set to true to skip OAuth and use mock user
const DEV_MODE = import.meta.env.DEV && !import.meta.env.VITE_OAUTH_PORTAL_URL;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // In development mode without OAuth, return a dummy URL
  if (DEV_MODE) {
    return "http://localhost:3000";
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Handle missing OAuth config gracefully
  if (!oauthPortalUrl || !appId) {
    console.warn("OAuth configuration missing. Running in development mode.");
    return "http://localhost:3000";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
