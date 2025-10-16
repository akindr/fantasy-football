# Firebase Admin Credentials Setup

Setup Firebase credentials

### Step 1: Generate Service Account Key

1. **Go to Firebase Console:**

    - Visit: https://console.firebase.google.com/
    - Select your project: **get-schwifty-football**

2. **Navigate to Service Accounts:**

    - Click the gear icon ⚙️ next to "Project Overview"
    - Click "Project settings"
    - Click the "Service accounts" tab

3. **Generate Key:**

    - Click "Generate new private key"
    - Click "Generate key" in the confirmation dialog
    - A JSON file will download

4. **Save the Key:**
    ```bash
    # Move the downloaded file to your project
    mv ~/Downloads/get-schwifty-football-*.json /Users/austink/dev/fantasy-football/functions/service-account-key.json
    ```

### Step 2: Run the Setup Script

```bash
cd /Users/austink/dev/fantasy-football/functions
npm run set-admin -- YOUR_FIREBASE_UID
```

The script will automatically detect and use the service account key.

### Step 3: Get Your Firebase UID

If you don't have your UID yet:

#### Firebase Console

1. Go to Firebase Console > Authentication > Users
2. Find your account (your email)
3. Copy the "User UID" column

### Step 4: Set Admin Claim

```bash
cd functions
npm run set-admin -- YOUR_UID_HERE
```

Expected output:

```
Using service account key file...
Found user: you@gmail.com
✅ Admin claim set successfully!
User you@gmail.com (abc123xyz) is now an admin.

Next steps:
1. Log out and back in to refresh your token
2. Navigate to /admin - you now have admin access!
```

## Security Notes

✅ **Never commit** the `service-account-key.json` file  
✅ **Keep it secret** - This file grants admin access to your Firebase project  
✅ **Use only locally** - Production uses Firebase Functions' built-in credentials

## Troubleshooting

### Error: "User not found"

- Make sure you've logged into your app at least once with Google
- Check that the UID is correct (no spaces, full string)

### Error: "Permission denied"

- Make sure the service account has the correct permissions
- In Firebase Console, check IAM & Admin to verify roles

### Error: "Project not found"

- Verify the project ID in the script matches your Firebase project
- Check: `functions/scripts/set-first-admin.ts` line 26

## After Setup

Once your admin claim is set:

1. ✅ Log out of the app
2. ✅ Log back in
3. ✅ Visit `/admin` - you should have access
4. ✅ (Optional) You can keep or delete the service account key file

## Questions?

- Check Firebase Console for user authentication status
- Check browser console for any client-side errors
- Check Firebase Functions logs for server-side errors
