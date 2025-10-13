import * as admin from 'firebase-admin';
import { logger } from './logger';

export interface IDatabaseService {
    set: (collection: string, doc: string, data: any) => Promise<void>;
    get: (collection: string, doc: string) => Promise<any>;
}

export class DatabaseService implements IDatabaseService {
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async set(collection: string, doc: string, data: any): Promise<void> {
        logger.info(`Setting data in collection ${collection} and doc ${doc}`);
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
