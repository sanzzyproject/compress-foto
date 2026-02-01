const Busboy = require('busboy');
const sharp = require('sharp');

// Disable Vercel's default body parser to handle multipart stream manually
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const busboy = Busboy({ 
        headers: req.headers,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB Limit
        }
    });

    const fields = {};
    let fileBuffer = null;
    let fileMimeType = '';

    return new Promise((resolve) => {
        // Parse fields (quality)
        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        // Parse file
        busboy.on('file', (fieldname, file, info) => {
            const { mimeType } = info;
            fileMimeType = mimeType;
            
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
            });

            file.on('limit', () => {
                res.status(413).json({ error: 'File size too large (Max 5MB)' });
                resolve();
            });
        });

        // Finish parsing
        busboy.on('finish', async () => {
            if (!fileBuffer) {
                res.status(400).json({ error: 'No image uploaded' });
                return resolve();
            }

            try {
                const quality = parseInt(fields.quality) || 80;
                let pipeline = sharp(fileBuffer);

                // Apply compression based on mime type
                if (fileMimeType === 'image/jpeg') {
                    pipeline = pipeline.jpeg({ quality });
                } else if (fileMimeType === 'image/png') {
                    // PNG compression is different, usually mix of compressionLevel and palette
                    pipeline = pipeline.png({ quality, compressionLevel: 8, palette: true });
                } else if (fileMimeType === 'image/webp') {
                    pipeline = pipeline.webp({ quality });
                } else {
                    // Fallback to jpeg if unknown or convert others to jpeg
                    pipeline = pipeline.toFormat('jpeg', { quality });
                    fileMimeType = 'image/jpeg';
                }

                const compressedBuffer = await pipeline.toBuffer();

                res.setHeader('Content-Type', fileMimeType);
                res.setHeader('Content-Length', compressedBuffer.length);
                res.send(compressedBuffer);
                resolve();

            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Image processing failed' });
                resolve();
            }
        });

        // Pipe request to busboy
        req.pipe(busboy);
    });
}
