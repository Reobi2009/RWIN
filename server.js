const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const multer = require('multer');

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Allowed file types
const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.pdf',
    '.txt'
];

// Configure file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        const filename =
            Date.now() + '-' +
            Math.round(Math.random() * 1E9) +
            extension;

        cb(null, filename);
    }
});

// Validate uploaded files
const upload = multer({
    storage: storage,

    fileFilter: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error('Unauthorized file type.'));
        }
    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Create HTTP server
const server = http.createServer((req, res) => {

    // Upload endpoint
    if (req.method === 'POST' && req.url === '/upload') {

        upload.single('file')(req, res, function (err) {

            if (err) {
                res.writeHead(400, {
                    'Content-Type': 'text/html'
                });

                res.end(`
                    <h1>Upload Failed</h1>
                    <p>${err.message}</p>
                    <a href="/upload.html">Try Again</a>
                `);

                return;
            }

            if (!req.file) {
                res.writeHead(400, {
                    'Content-Type': 'text/html'
                });

                res.end(`
                    <h1>Upload Failed</h1>
                    <p>No file was selected.</p>
                    <a href="/upload.html">Try Again</a>
                `);

                return;
            }

            res.writeHead(200, {
                'Content-Type': 'text/html'
            });

            res.end(`
                <h1>Upload Successful!</h1>
                <p>File uploaded successfully.</p>
                <p>Filename: ${req.file.filename}</p>
                <p>Size: ${req.file.size} bytes</p>
                <a href="/upload.html">Upload Another File</a>
            `);
        });

        return;
    }

    // Serve files from public folder
    let requestedFile = req.url === '/'
        ? 'index.html'
        : req.url.substring(1);

    const filePath = path.join(__dirname, 'public', requestedFile);

    // Prevent access outside public directory
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {

        if (err) {

            if (err.code === 'ENOENT') {
                res.writeHead(404, {
                    'Content-Type': 'text/html'
                });

                res.end('<h1>404 - File Not Found</h1>');

            } else {
                res.writeHead(500);

                res.end('Internal Server Error');
            }

            return;
        }

        const contentType =
            mime.lookup(filePath) || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType
        });

        res.end(data);
    });
});

// Render provides PORT through environment variable
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Node.js File Server running on port ${PORT}`);
});