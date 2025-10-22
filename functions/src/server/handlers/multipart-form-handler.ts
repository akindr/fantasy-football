import Busboy from 'busboy';
import type { Request } from 'firebase-functions/v2/https';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Handles multipart/form-data uploads using Busboy.
 * Returns a Promise that resolves with parsed fields and file data,
 * or rejects with an error.
 *
 * @param {object} req - The Express or Cloud Function request object.
 * @returns {Promise<{fields: object, file: {buffer: Buffer, name: string, mimetype: string}}>}
 */
export const handleMultipartUpload = (
    req: Request
): Promise<{
    fields: Record<string, string>;
    file: { buffer: Buffer; name: string; mimetype: string };
}> => {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({
            headers: req.headers,
            limits: {
                fileSize: MAX_FILE_SIZE,
            },
        });

        const fields: Record<string, string> = {};
        let fileReadPromise: Promise<void> | null = null;
        let uploadedFileBuffer: Buffer | null = null;
        let fileMimeType = '';
        let fileName = '';

        busboy.on('field', (fieldname: string, val: string) => {
            fields[fieldname] = val;
        });

        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            fileName = filename;
            fileMimeType = mimeType;

            // Ensure only one file is uploaded to a field named 'file'
            if (fileReadPromise !== null || fieldname !== 'file') {
                file.resume(); // Consume the stream to prevent process hanging
                return reject({
                    status: 400,
                    message: 'Only one file upload per request is allowed in the "file" field.',
                });
            }

            const fileChunks: Buffer[] = [];
            fileReadPromise = new Promise<void>((innerResolve, innerReject) => {
                file.on('data', data => fileChunks.push(data));
                file.on('end', () => {
                    uploadedFileBuffer = Buffer.concat(fileChunks);
                    innerResolve();
                });
                file.on('error', innerReject);
            });

            file.on('limit', () => {
                reject({
                    status: 413,
                    message: `File size limit exceeded (max ${MAX_FILE_SIZE / (1024 * 1024)}MB).`,
                });
            });
        });

        busboy.on('error', (err: Error) => {
            console.error('Busboy parsing error:', err);
            if (err.message && err.message.includes('file size limit')) {
                reject({
                    status: 413,
                    message: `File size limit exceeded (max ${MAX_FILE_SIZE / (1024 * 1024)}MB).`,
                });
            } else {
                reject({ status: 500, message: 'Error parsing form data.' });
            }
        });

        busboy.on('finish', async () => {
            try {
                if (fileReadPromise) {
                    await fileReadPromise;
                }

                if (!uploadedFileBuffer || !fileName) {
                    return reject({
                        status: 400,
                        message: 'No file uploaded or file data is missing.',
                    });
                }

                resolve({
                    fields,
                    file: {
                        buffer: uploadedFileBuffer,
                        name: fileName,
                        mimetype: fileMimeType,
                    },
                });
            } catch (error: unknown) {
                reject({
                    status: 500,
                    message: 'Failed to process file upload.',
                    originalError: error,
                });
            }
        });

        // The crucial part: how to feed the raw body to Busboy
        // Cloud Functions / Firebase Emulators provide req.rawBody
        if (req.rawBody) {
            busboy.end(req.rawBody);
        } else {
            // For standard Express, we pipe the request stream directly.
            // IMPORTANT: Ensure no other middleware (like body-parser) has consumed the stream before this point.
            req.pipe(busboy);
        }
    });
};
