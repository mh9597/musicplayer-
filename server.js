// server.js - Zero-dependency HTTP server with audio streaming & song management
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SONGS_FILE = path.join(ROOT, 'songs.json');

// Ensure directories exist
['covers', 'music'].forEach(dir => {
    const p = path.join(ROOT, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// MIME types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.ico': 'image/x-icon'
};

function getSongs() {
    try {
        if (fs.existsSync(SONGS_FILE)) {
            const data = fs.readFileSync(SONGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading songs.json:', err);
    }
    return [];
}

function saveSongs(songs) {
    fs.writeFileSync(SONGS_FILE, JSON.stringify(songs, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // API Routes
    if (pathname === '/api/songs') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(getSongs()));
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const songs = getSongs();
                    
                    let coverPath = data.cover_image || '';
                    let audioPath = data.audio_file || '';

                    // Handle Base64 file uploads if provided
                    if (data.coverData && data.coverName) {
                        const coverExt = path.extname(data.coverName) || '.png';
                        const coverFilename = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${coverExt}`;
                        const base64Data = data.coverData.replace(/^data:image\/\w+;base64,/, '');
                        fs.writeFileSync(path.join(ROOT, 'covers', coverFilename), Buffer.from(base64Data, 'base64'));
                        coverPath = `covers/${coverFilename}`;
                    }

                    if (data.audioData && data.audioName) {
                        const audioExt = path.extname(data.audioName) || '.mp3';
                        const audioFilename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${audioExt}`;
                        const base64Audio = data.audioData.replace(/^data:audio\/\w+;base64,/, '');
                        fs.writeFileSync(path.join(ROOT, 'music', audioFilename), Buffer.from(base64Audio, 'base64'));
                        audioPath = `music/${audioFilename}`;
                    }

                    const newSong = {
                        id: Date.now(),
                        title: data.title || 'Untitled',
                        artist: data.artist || 'Unknown Artist',
                        featuring: data.featuring || '',
                        album: data.album || 'Single',
                        duration: parseInt(data.duration, 10) || 0,
                        lyrics: data.lyrics || '',
                        cover_image: coverPath || 'https://placehold.co/500x500/3d3d62/ffffff?text=Music',
                        audio_file: audioPath
                    };

                    songs.push(newSong);
                    saveSongs(songs);

                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, song: newSong }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }
    }

    if (pathname.startsWith('/api/songs/') && req.method === 'DELETE') {
        const idToDelete = parseInt(pathname.replace('/api/songs/', ''), 10);
        const songs = getSongs();
        const filtered = songs.filter(s => s.id !== idToDelete);
        saveSongs(filtered);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: filtered.length }));
        return;
    }

    // Static File Serving
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(ROOT, pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // HTTP 206 Partial Content support for seeking audio
        const range = req.headers.range;
        if (range && (contentType.startsWith('audio/') || contentType.startsWith('video/'))) {
            const total = stats.size;
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

            if (start >= total || end >= total) {
                res.writeHead(416, { 'Content-Range': `bytes */${total}` });
                res.end();
                return;
            }

            const chunksize = end - start + 1;
            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType
            });
            fileStream.pipe(res);
            return;
        }

        res.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🎵 Ohm Music Player server running at http://localhost:${PORT}`);
    });
}

module.exports = server;
