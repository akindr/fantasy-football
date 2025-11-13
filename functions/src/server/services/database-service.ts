import * as admin from 'firebase-admin';
import { logger } from './logger';

export interface IDatabaseService {
    set: (collection: string, doc: string, data: any) => Promise<void>;
    get: (collection: string, doc: string) => Promise<any>;
    checkForDoc: (collection: string, prefix: string) => Promise<boolean>;
}

export class DatabaseService implements IDatabaseService {
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async checkForDoc(collection: string, prefix: string): Promise<boolean> {
        // \uf8ff ensures we include all IDs that start with the prefix
        const endString = prefix + '\uf8ff';

        // Use the special FieldPath.documentId()
        const documentIdField = admin.firestore.FieldPath.documentId();

        const queryRef = this.db
            .collection(collection)
            .where(documentIdField, '>=', prefix)
            .where(documentIdField, '<', endString)
            .limit(1); // Only need to retrieve one document to check for existence

        try {
            const snapshot = await queryRef.get();

            // Check if the query returned any documents
            return !snapshot.empty;
        } catch (error) {
            logger.error(
                `Error querying documents for ${collection} with prefix ${prefix}:`,
                error
            );
            return false;
        }
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
