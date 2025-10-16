# Admin Setup Guide - Firebase Custom Claims

## Overview

This application uses **Firebase Custom Claims** to manage admin privileges. This is a secure, scalable, and Firebase-recommended approach for role-based access control.

## How It Works

### 1. **Frontend - React**

- Admin status is checked directly from the Firebase ID token (no API calls needed)
- Claims are cryptographically signed and verified by Firebase
- The `/admin` route automatically verifies admin privileges

### 2. **Backend - Express + Firebase Admin**

- Single middleware: `firebaseAuthMiddleware` checks for `admin: true` claim
- All admin routes are protected with this middleware
- Clean and simple implementation

### 3. **Custom Claims**

- Claims are stored in the user's ID token
- Refreshed automatically with the token
- Available on both client and server

## Setup Instructions

### One-Time Setup (First Admin User)

Setting up the first admin user is simple using the provided setup script:

#### Step 1: Get Your Firebase UID

Log into your app and get your Firebase UID:

**Option A - Browser Console:**

```javascript
// After logging in, open browser console and run:
firebase.auth().currentUser.uid;
```

**Option B - Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Authentication > Users
4. Find your account and copy the User UID

#### Step 2: Run the Setup Script

```bash
cd functions
npm run set-admin -- YOUR_FIREBASE_UID
```

Example output:

```
Found user: you@gmail.com
✅ Admin claim set successfully!
User you@gmail.com (abc123...) is now an admin.

Next steps:
1. Have the user log out and back in to refresh their token
2. They can now access /admin
```

#### Step 3: Refresh Your Token

1. **Log out** of the application
2. **Log back in** with your Google account
3. **Navigate to** `/admin`
4. **Success!** You should now have full admin access

## Architecture Details

### Backend Files

#### `functions/src/server/auth-middleware.ts`

```typescript
// Single middleware - checks for admin claim
export const firebaseAuthMiddleware;
```

- Verifies Firebase ID token
- Checks for `admin: true` custom claim
- Blocks access if claim is missing

#### `functions/src/server/admin-routes.ts`

```typescript
// Example protected route
adminRouter.get('/hello', firebaseAuthMiddleware, (req, res) => {
    res.json({ message: 'Hello, admin!' });
});
```

All routes in this router are automatically protected.

#### `functions/scripts/set-first-admin.ts`

One-time setup script to set admin claims. Can be deleted after first use if desired.

### Frontend Files

#### `src/services/google-auth-service.ts`

```typescript
// Check if current user has admin claim
async isAdmin(): Promise<boolean>
```

Forces token refresh to get latest claims and checks for admin status.

#### `src/components/routes/admin.tsx`

- Verifies admin access via custom claims
- Redirects non-admin users to home page
- Shows admin dashboard when authorized

## Adding More Admin Users

Once you have the first admin set up, you have several options:

### Option 1: Run the Script Again (Simplest)

```bash
cd functions
npm run set-admin -- ANOTHER_USER_UID
```
