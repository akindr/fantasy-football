export const YAHOO_CLIENT_ID = import.meta.env.REACT_APP_YAHOO_CLIENT_ID || '';
export const REDIRECT_DOMAIN = import.meta.env.REACT_APP_REDIRECT_DOMAIN || 'localhost:3000';

// Yahoo Fantasy API configuration
export const API_CONFIG = {
    clientId: YAHOO_CLIENT_ID,
    redirectUri: `https://${REDIRECT_DOMAIN}/auth/callback`,
};
