import * as admin from "firebase-admin";
import { ILogger } from "./logger";

export interface IDatabaseService {
  set: (collection: string, doc: string, data: any) => Promise<void>;
  get: (collection: string, doc: string) => Promise<any>;
}

export class DatabaseService implements IDatabaseService {
  private logger: ILogger;
  private db: admin.firestore.Firestore;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.db = admin.firestore();
  }

  async set(collection: string, doc: string, data: any): Promise<void> {
    this.logger.info(`Setting data in collection ${collection} and doc ${doc}`);
    try {
      const docRef = this.db.collection(collection).doc(doc);
      await docRef.set(data);
    } catch (error) {
      this.logger.error("Error in set", error);
      throw error;
    }
  }

  async get(collection: string, doc: string): Promise<any> {
    this.logger.info(`Getting data from collection ${collection} and doc ${doc}`);
    try {
      const docRef = this.db.collection(collection).doc(doc);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error("Error in get", error);
      throw error;
    }
  }
}