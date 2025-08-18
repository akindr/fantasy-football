# Austin's Yahoo Fantasy App

**TLDR;** Shows Yahoo league information

## Overview

This app contains a vite-based client React application, and an express server for the API.

# Getting Started

## Local Setup

There are two uncomitted files needed:

1. a `.env` file with the Yahoo API credentials
1. a localhost SSL certificate

### Yahoo API Credentials

Create a .env file with the following information:

```lang=bash
REACT_APP_YAHOO_CLIENT_ID=<CLIENT_ID_HERE>
REACT_APP_YAHOO_CLIENT_SECRET=<CLIENT_SECRET_HERE>
```

You can find these in the Yahoo developer documentation: https://developer.yahoo.com/apps/

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

# Deployment

_TBD_
