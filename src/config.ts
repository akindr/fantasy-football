export const YAHOO_CLIENT_ID = process.env.REACT_APP_YAHOO_CLIENT_ID || '';
export const YAHOO_CLIENT_SECRET = process.env.REACT_APP_YAHOO_CLIENT_SECRET || '';

// Yahoo Fantasy API configuration
export const API_CONFIG = {
    clientId: YAHOO_CLIENT_ID,
    clientSecret: YAHOO_CLIENT_SECRET,
    redirectUri: `${window.location.origin}/auth/callback`,
};
