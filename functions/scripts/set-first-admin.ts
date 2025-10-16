#!/usr/bin/env ts-node
/**
 * One-time setup script to set the first admin user
 *
 * Prerequisites:
 *   1. Make sure you're logged into Firebase: firebase login
 *   2. Set up application default credentials:
 *      export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
 *      OR use: gcloud auth application-default login
 *
 * Usage:
 *   npm run set-admin -- YOUR_FIREBASE_UID
 *
 * This script sets the admin custom claim on a user account.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

// Get project ID
const projectId = process.env.FIREBASE_PROJECT_ID || 'get-schwifty-football';

// Check for service account key file
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
const hasServiceAccount = fs.existsSync(serviceAccountPath);

// Initialize Firebase Admin
if (hasServiceAccount) {
    console.log('Using service account key file...');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
    });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using GOOGLE_APPLICATION_CREDENTIALS...');
    admin.initializeApp({
        projectId: projectId,
    });
} else {
    console.error('❌ Firebase credentials not found!\n');
    console.log('Please set up credentials using ONE of these methods:\n');
    console.log('Method 1 - Service Account Key (Recommended for local dev):');
    console.log('  1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('  2. Click "Generate New Private Key"');
    console.log('  3. Save the file as: functions/service-account-key.json');
    console.log('  4. Add to .gitignore: echo "service-account-key.json" >> .gitignore\n');
    console.log('Method 2 - Application Default Credentials:');
    console.log('  Run: gcloud auth application-default login\n');
    console.log('Method 3 - Environment Variable:');
    console.log('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"\n');
    process.exit(1);
}

async function setAdminClaim(uid: string) {
    try {
        // Verify the user exists
        const user = await admin.auth().getUser(uid);
        console.log(`Found user: ${user.email}`);

        // Set admin claim
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        console.log('✅ Admin claim set successfully!');
        console.log(`User ${user.email} (${uid}) is now an admin.`);
        console.log('\nNext steps:');
        console.log('1. Log out and back in to refresh your token');
        console.log('2. Navigate to /admin - you now have admin access!');
        console.log('3. (Optional) You can delete this script if you no longer need it');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting admin claim:', error);
        process.exit(1);
    }
}

// Get UID from command line
const uid = process.argv[2];

if (!uid) {
    console.error('❌ Please provide a Firebase UID');
    console.log('Usage: npm run set-admin -- YOUR_FIREBASE_UID');
    console.log('\nTo find your UID:');
    console.log('1. Log into your app with Google');
    console.log('2. Open browser console and run: firebase.auth().currentUser.uid');
    console.log('3. Or check Firebase Console > Authentication > Users');
    process.exit(1);
}

setAdminClaim(uid);
