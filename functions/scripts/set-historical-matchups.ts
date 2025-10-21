#!/usr/bin/env ts-node
/**
 * Script to insert historical matchup data into Firestore
 *
 * Prerequisites:
 *   1. Make sure you're logged into Firebase: firebase login
 *   2. Set up application default credentials:
 *      export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
 *      OR use: gcloud auth application-default login
 *
 * Usage:
 *   npm run insert-historical-data
 *
 * This script inserts the historical matchup data from data/historical-matchups.json
 * into the Firestore collection 'historical-data'. It will overwrite existing data.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

import { type HistoricalData } from '../src/server/services/yahoo-gateway';

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
    // eslint-disable-next-line
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

async function insertHistoricalMatchups() {
    try {
        // Read the JSON file
        const dataPath = path.join(__dirname, '../../data/historical-matchups.json');

        if (!fs.existsSync(dataPath)) {
            console.error('❌ Historical matchups file not found at:', dataPath);
            process.exit(1);
        }

        console.log('📖 Reading historical matchups data...');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const historicalData = JSON.parse(rawData) as HistoricalData;

        // Get Firestore instance
        const db = admin.firestore();

        for (const year of Object.keys(historicalData)) {
            const yearlyData = historicalData[year];

            console.log('💾 Inserting data into Firestore...');
            console.log(`   Collection: historical-data`);
            console.log(`   Document ID: matchups-${year}`);
            const docRef = db.collection('historical-data').doc(`matchups-${year}`);
            await docRef.set(yearlyData);
        }

        console.log('✅ Historical matchup data inserted successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error inserting historical matchups:', error);
        process.exit(1);
    }
}

insertHistoricalMatchups();
