import { type Request } from 'firebase-functions/v2/https';

import { handleMultipartUpload } from './server/handlers/multipart-form-handler';
import { StorageService } from './server/services/storage-service';

// const storageService = new StorageService();
let storageService: StorageService | null = null;

// @eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadFile = async (req: Request, res: any) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
    }

    if (!storageService) {
        storageService = new StorageService();
    }

    // Check for multipart/form-data content type
    if (
        !req.headers['content-type'] ||
        !req.headers['content-type'].startsWith('multipart/form-data')
    ) {
        res.status(400).send('Expected multipart/form-data content type.');
    }

    try {
        const { file } = await handleMultipartUpload(req);

        // Your Firebase Storage upload logic
        const { publicUrl } = await storageService.uploadImage(
            file.buffer,
            file.name,
            file.mimetype
        );

        res.status(200).json({
            message: 'File uploaded successfully to Firebase Storage!',
            fileName: file.name,
            fileSize: file.buffer.length,
            contentType: file.mimetype,
            publicUrl,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return res.status(500).send(error.message);
        }
        console.error('File upload error:', error);
        res.status(500).send('Internal Server Error');
    }
};
