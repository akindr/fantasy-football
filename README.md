# Austin's Yahoo Fantasy App

**TLDR;** Shows Yahoo league information

## Overview

This app contains a vite-based client React application, and an express server for the API.

# Getting Started

## Local Setup

There are two uncomitted files needed:

1. a `functions/.env.development` file with sensitive information like Yahoo client secrets, etc...
1. a localhost SSL certificate

### Yahoo API Credentials

Create the `functions/.env.development` file with the following information:

```lang=bash
FF_APP_YAHOO_CLIENT_ID=dj0yJmk9YmNKWjZlVENQQlRmJmQ9WVdrOVZHRkxUbXQxTTFjbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTI1
FF_APP_YAHOO_CLIENT_SECRET=<SECRET HERE>
FF_APP_YAHOO_AUTH_REDIRECT_URL=https://localhost:3000/auth/callback
FF_APP_GEMINI_API_KEY=<SECRET HERE>
```

You can find these in the Yahoo developer documentation: https://developer.yahoo.com/apps/ and the Gemini documentation: https://aistudio.google.com/apikey

### Local SSL certificate

This app contains a server that proxies calls to the Yahoo API. This is an HTTP server.

1. Install `mkcert`

```
brew install mkcert
```

2. Setup local CA

```
mkcert -install
```

3. Create the cert (from project root)

```
mkdir .cert
cd .cert
mkcert -cert-file localhost.pem -key-file localhost.key.pem localhost 127.0.0.1
```

## Install

Recommend using NVM to ensure we have the correct node version.

```lang=bash
# Ensure we're using Node 24
nvm use

# Install deps
npm install
```

## Running the App

Simply run the following command to start both the server and client

```lang=bash
npm run dev
```

If you want to run them separately, you can do so

```lang=bash
npm run dev-server

npm run dev-client
```

### Local server notes

In production, we use Firebase functions to host the express app. Rather than use the local emulator, we just use express directly over HTTPS. This is to account for the Yahoo API restrictions around OAuth. **TLDR;** Yahoo will only do the token callback if it is over HTTPS. Thus, just use the express server directly.

The React query setup will use the right URL depending on runtime env.

# Deployment

## Firebase Setup

### Secrets & Params

There are a few secrets required:

- YAHOO_CLIENT_ID: The client ID for the yahoo app
- YAHOO_CLIENT_SECRET: The client secret for the yahoo app
- GEMINI_API_KEY: API key to talk to Gemini
- ALLOWED_UID: Allowed user IDs from firebase auth who are admins

These are regular parameters:

- YAHOO_AUTH_REDIRECT_URL

The `YAHOO_AUTH_REDIRECT_URL` should be `https://getschwiftyff.com/auth/callback`

#### Updating the values

For secrets, enter this command then set the value:

```
firebase functions:secrets:set GEMINI_API_KEY
```

For params, it'll prompt you the first time and then create a `.env.get-schwifty-football` file entry under the `functions` dir.
