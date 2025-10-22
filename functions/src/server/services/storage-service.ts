import * as admin from 'firebase-admin';
import { logger } from './logger';

export class StorageService {
    private bucket: admin.storage.Storage;

    constructor() {
        this.bucket = admin.storage();
    }

    /**
     * Upload a file to Firebase Storage
     * @param file - The file buffer to upload
     * @param destination - The path where the file should be stored (e.g., 'images/award-123.jpg')
     * @param contentType - The MIME type of the file
     * @returns The public URL of the uploaded file
     */
    uploadFile = async (
        file: Buffer,
        destination: string,
        contentType: string
    ): Promise<string> => {
        try {
            const bucketFile = this.bucket.bucket().file(destination);

            await bucketFile.save(file, {
                metadata: {
                    contentType,
                    metadata: {
                        firebaseStorageDownloadTokens: this.generateUUID(),
                    },
                },
                public: true,
                validation: 'md5',
            });

            // Make the file publicly accessible
            await bucketFile.makePublic();

            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${this.bucket.bucket().name}/${destination}`;

            logger.info('File uploaded successfully', { destination, publicUrl });

            return publicUrl;
        } catch (error) {
            logger.error('Error uploading file to storage:', error);
            throw new Error('Failed to upload file');
        }
    };

    /**
     * Delete a file from Firebase Storage
     * @param filePath - The path of the file to delete
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await this.bucket.bucket().file(filePath).delete();
            logger.info('File deleted successfully', { filePath });
        } catch (error) {
            logger.error('Error deleting file from storage:', error);
            throw new Error('Failed to delete file');
        }
    }

    /**
     * Get a signed URL for a file (for private files)
     * @param filePath - The path of the file
     * @param expiresInMinutes - How long the URL should be valid (default 60 minutes)
     * @returns A signed URL that expires
     */
    async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
        try {
            const file = this.bucket.bucket().file(filePath);
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + expiresInMinutes * 60 * 1000,
            });
            return url;
        } catch (error) {
            logger.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    /**
     * Generate a UUID for file tokens
     * @private
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    uploadImage = async (
        buffer: Buffer,
        fileName: string,
        contentType: string
    ): Promise<{ fileName: string; publicUrl: string }> => {
        // Generate a unique filename
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const fullFileName = `award-images/${timestamp}.${fileExtension}`;

        // Upload to Firebase Storage
        const publicUrl = await this.uploadFile(buffer, fullFileName, contentType);

        logger.info('Image uploaded successfully', { fileName, publicUrl });

        return { fileName, publicUrl };
    };
}
