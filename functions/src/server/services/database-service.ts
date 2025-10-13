import * as admin from 'firebase-admin';
import { logger } from './logger';
import fs from 'fs';

export interface IDatabaseService {
    set: (collection: string, doc: string, data: any) => Promise<void>;
    get: (collection: string, doc: string) => Promise<any>;
}

export class DatabaseService implements IDatabaseService {
    private db: admin.firestore.Firestore | null = null;

    constructor(startDatabase: boolean) {
        if (startDatabase) {
            this.db = admin.firestore();
        }
    }

    async set(collection: string, doc: string, data: any): Promise<void> {
        logger.info(`Setting data in collection ${collection} and doc ${doc}`);
        if (!this.db) {
            // Write to tmp json file
            fs.writeFileSync(`tmp/${collection}-${doc}.json`, JSON.stringify(data));
            return;
        }
        try {
            const docRef = this.db.collection(collection).doc(doc);
            await docRef.set(data);
        } catch (error) {
            logger.error('Error in set', error);
            throw error;
        }
    }

    async get(collection: string, doc: string): Promise<any> {
        logger.info(`Getting data from collection ${collection} and doc ${doc}`);
        if (!this.db) {
            // Read from tmp json file
            const data = fs.readFileSync(`tmp/${collection}-${doc}.json`, 'utf8');
            return JSON.parse(data);
        }
        try {
            const docRef = this.db.collection(collection).doc(doc);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            logger.error('Error in get', error);
            throw error;
        }
    }
}
