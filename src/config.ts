export const YAHOO_CLIENT_ID = import.meta.env.FF_APP_YAHOO_CLIENT_ID || '';
export const REDIRECT_URI = import.meta.env.FF_APP_YAHOO_AUTH_REDIRECT_URL || 'localhost:3000';
export const TOKEN_URI = import.meta.env.FF_APP_TOKEN_URL || 'https://localhost:3001/oauth/token';
export const BASE_URL = import.meta.env.FF_APP_API_URL || 'https://localhost:3001/api';

// Yahoo Fantasy API configuration
export const API_CONFIG = {
    clientId: YAHOO_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    tokenUri: TOKEN_URI,
    apiUri: BASE_URL,
};
