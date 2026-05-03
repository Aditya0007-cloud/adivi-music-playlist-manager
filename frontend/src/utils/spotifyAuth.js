const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const SPOTIFY_TOKEN_KEY = "adivi_spotify_token";
const SPOTIFY_VERIFIER_KEY = "adivi_spotify_code_verifier";
const SPOTIFY_STATE_KEY = "adivi_spotify_auth_state";

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing"
];

export const isSpotifyConfigured = () => Boolean(SPOTIFY_CLIENT_ID);

const getRedirectUri = () => `${window.location.origin}/`;

const generateRandomString = (length = 64) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((text, value) => text + possible[value % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  return window.crypto.subtle.digest("SHA-256", encoder.encode(plain));
};

const base64UrlEncode = (input) =>
  btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const saveToken = (tokenData, previousRefreshToken = "") => {
  const token = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || previousRefreshToken,
    expires_at: Date.now() + tokenData.expires_in * 1000 - 60_000
  };
  localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(token));
  return token;
};

export const clearSpotifyToken = () => {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  localStorage.removeItem(SPOTIFY_VERIFIER_KEY);
  localStorage.removeItem(SPOTIFY_STATE_KEY);
};

export const getSavedSpotifyToken = () => {
  try {
    const rawToken = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    return rawToken ? JSON.parse(rawToken) : null;
  } catch {
    clearSpotifyToken();
    return null;
  }
};

export const startSpotifyLogin = async () => {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error("Add VITE_SPOTIFY_CLIENT_ID in frontend environment variables first.");
  }

  const codeVerifier = generateRandomString(96);
  const state = generateRandomString(32);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  localStorage.setItem(SPOTIFY_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(SPOTIFY_STATE_KEY, state);

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state
  }).toString();

  window.location.href = authUrl.toString();
};

export const completeSpotifyLoginFromUrl = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");

  if (error) {
    throw new Error(`Spotify login failed: ${error}`);
  }

  if (!code) return null;

  const receivedState = params.get("state");
  const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);
  const codeVerifier = localStorage.getItem(SPOTIFY_VERIFIER_KEY);

  if (!expectedState || receivedState !== expectedState) {
    clearSpotifyToken();
    throw new Error("Spotify login state did not match. Please connect again.");
  }

  if (!codeVerifier) {
    throw new Error("Spotify login expired. Please connect again.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier
    })
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(tokenData.error_description || "Spotify token exchange failed.");
  }

  localStorage.removeItem(SPOTIFY_VERIFIER_KEY);
  localStorage.removeItem(SPOTIFY_STATE_KEY);
  return saveToken(tokenData);
};

export const refreshSpotifyToken = async () => {
  const savedToken = getSavedSpotifyToken();
  if (!savedToken?.refresh_token || !SPOTIFY_CLIENT_ID) return null;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: savedToken.refresh_token
    })
  });

  const tokenData = await response.json();
  if (!response.ok) {
    clearSpotifyToken();
    throw new Error(tokenData.error_description || "Spotify token refresh failed.");
  }

  return saveToken(tokenData, savedToken.refresh_token);
};

export const getSpotifyAccessToken = async () => {
  const savedToken = getSavedSpotifyToken();
  if (!savedToken?.access_token) return null;

  if (savedToken.expires_at > Date.now()) {
    return savedToken.access_token;
  }

  const refreshedToken = await refreshSpotifyToken();
  return refreshedToken?.access_token || null;
};
