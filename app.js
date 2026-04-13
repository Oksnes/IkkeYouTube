const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const database = require('better-sqlite3')
const db = new database('ikkeyoutube.db');
const multer = require('multer');
const path = require('path');
const stream = require('stream');

require('dotenv').config();

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, 'public/multerFiles');
// Create upload directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024  // 2 GB limit
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'image/jpeg', 'image/png', 'image/webm'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Try a different file.'), false);
        }
    }
});

async function saveFileBuffer(buffer, originalName, opts = {}) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName || '').toLowerCase();

    let filename = `${uniqueSuffix}${ext}`;
    if (opts.prefix) {
        filename = `${opts.prefix}-${filename}`;
    }
    
    // Write the buffer to disk
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    
    return filename;
}

db.prepare(`
-- User table
CREATE TABLE IF NOT EXISTS User (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profilePicture TEXT,
    description TEXT,
    admin TEXT
);
`).run();

db.prepare(`
-- Video table
CREATE TABLE IF NOT EXISTS Video (
    videoID INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    userID INTEGER NOT NULL,
    videoPath TEXT NOT NULL,
    thumbnailPath TEXT NOT NULL,
    FOREIGN KEY (userID) REFERENCES User(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
`).run();

db.prepare(`
-- Comment table
CREATE TABLE IF NOT EXISTS Comment (
    commentID INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    userID INTEGER NOT NULL,
    videoID INTEGER NOT NULL,
    FOREIGN KEY (userID) REFERENCES User(userID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (videoID) REFERENCES Video(videoID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
`).run();

db.prepare(`
-- LikedVideo junction table
CREATE TABLE IF NOT EXISTS LikedVideo (
    userID INTEGER NOT NULL,
    videoID INTEGER NOT NULL,
    PRIMARY KEY (userID, videoID),
    FOREIGN KEY (userID) REFERENCES User(userID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (videoID) REFERENCES Video(videoID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
`).run();

db.prepare(`
-- Playlist table
CREATE TABLE IF NOT EXISTS Playlist (
    playlistID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    userID INTEGER NOT NULL,
    FOREIGN KEY (userID) REFERENCES User(userID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
`).run();

db.prepare(`
-- VideoForPlaylist junction table
CREATE TABLE IF NOT EXISTS VideoForPlaylist (
    playlistID INTEGER NOT NULL,
    videoID INTEGER NOT NULL,
    PRIMARY KEY (playlistID, videoID),
    FOREIGN KEY (playlistID) REFERENCES Playlist(playlistID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (videoID) REFERENCES Video(videoID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
`).run();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 60 * 24 } // 1 day
}));


function requireLogin(req, res, next) { //ting med ruten requireLogin krever at du er logget inn for å få tilgang
  if (!req.session.User) { //Se om bruker er logget inn
      return res.redirect("/login.html"); //send til login siden hvis du ikke er logget inn
  }
  next();
}

app.get('/', (req, res) => { //sender deg til index.html som standard.
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/home', requireLogin, (req, res) => { //sender deg til home.html hvis du er logget inn, hvis ikke blir du sendt til login.html
    res.sendFile(__dirname + '/public/home.html');
});

app.post('/register', async (req, res) => {
    upload.single('profilePicture')(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: true, message: err.message });
            } else if (err) {
                return res.status(400).json({ error: true, message: err.message });
            }

            const { username, password, email } = req.body;

            if (!username || !password || !email) {
                return res.status(400).json({ error: true, message: 'Username, password, and email are required.' });
            }

            const existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
            if (existingUser) {
                return res.status(400).json({ error: true, message: 'Email already in use.' });
            }

            if (!req.file) {
                return res.status(400).json({ error: true, message: 'Profile picture is required.' });
            }

            const profilePictureName = req.file ? await saveFileBuffer(req.file.buffer, req.file.originalname, { width: 200, height: 200}) : null;
            const profilePicture = profilePictureName ? `/multerFiles/${profilePictureName}` : null;

            const saltrounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltrounds);

            const stmt = db.prepare('INSERT INTO User (username, password, email, profilePicture) VALUES (?, ?, ?, ?)');
            stmt.run(username, hashedPassword, email, profilePicture);
            return res.status(201).json({ error: false, message: 'User created successfully.' });
        } catch (err) {
            return res.status(500).json({ error: 'Server error: ' + err.message });
        }
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const User = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
    if (!User) {
        return res.status(400).json({ error: true, message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, User.password);
    if (!passwordMatch) {
        return res.status(400).json({ error: true, message: 'Invalid email or password.' });
    }

    req.session.User = { id: User.userID, Username: User.username, Admin: User.admin || 'false', profilePicture: User.profilePicture };
    res.json({ error: false, message: 'Login successful.' });
});

app.post('/uploadVideo', requireLogin, async (req, res) => {
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ])(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: true, message: err.message });
            } else if (err) {
                return res.status(400).json({ error: true, message: err.message });
            }

            const { title, description } = req.body;
            const videoFile = req.files?.video?.[0];
            const thumbnailFile = req.files?.thumbnail?.[0];

            if (!title) {
                return res.status(400).json({ error: true, message: 'Title is required.' });
            }

            if (!videoFile) {
                return res.status(400).json({ error: true, message: 'Video file is required.' });
            }

            if (!thumbnailFile) {
                return res.status(400).json({ error: true, message: 'Thumbnail file is required.' });
            }

            // Save video file
            const videoFileName = await saveFileBuffer(videoFile.buffer, videoFile.originalname, { prefix: `${title}_video` });
            const videoPath = `/multerFiles/${videoFileName}`;

            // Save thumbnail file
            const thumbnailFileName = await saveFileBuffer(thumbnailFile.buffer, thumbnailFile.originalname, { prefix: `${title}_thumbnail` });
            const thumbnailPath = `/multerFiles/${thumbnailFileName}`;

            const unixTimestamp = Math.floor(Date.now() / 1000);
            // Insert video into database
            const userID = req.session.User.id;
            const stmt = db.prepare('INSERT INTO Video (title, description, userID, videoPath, thumbnailPath, time) VALUES (?, ?, ?, ?, ?, ?)');
            const info = stmt.run(title, description || null, userID, videoPath, thumbnailPath, unixTimestamp);

            return res.status(201).json({
                error: false,
                message: 'Video uploaded successfully.',
                videoID: info.lastInsertRowid,
                videoPath: videoPath,
                thumbnailPath: thumbnailPath
            });
        } catch (err) {
            return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
        }
    });
});

app.get('/api/currentUser', requireLogin, (req, res) => {
    try {
        const user = db.prepare('SELECT userID, username, profilePicture FROM User WHERE userID = ?').get(req.session.User.id);
        return res.json({ error: false, user });
    } catch (err) {
        return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
    }
});

app.get('/api/videos', (req, res) => {
    try {
        const videos = db.prepare(`
            SELECT v.videoID, v.title, v.description, v.thumbnailPath, v.videoPath, v.userID, u.username, u.profilePicture
            FROM Video v
            JOIN User u ON v.userID = u.userID
            ORDER BY v.videoID DESC
        `).all();
        
        return res.json({ error: false, videos });
    } catch (err) {
        return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
    }
});

app.get('/api/video/:videoID', (req, res) => {
    try {
        const { videoID } = req.params;
        const video = db.prepare(`
            SELECT v.videoID, v.title, v.description, v.thumbnailPath, v.videoPath, v.userID, u.username, u.profilePicture
            FROM Video v
            JOIN User u ON v.userID = u.userID
            WHERE v.videoID = ?
        `).get(videoID);
        
        if (!video) {
            return res.status(404).json({ error: true, message: 'Video not found.' });
        }
        
        return res.json({ error: false, video });
    } catch (err) {
        return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
    }
});

app.get('/api/comments/:videoID', (req, res) => {
    try {
        const { videoID } = req.params;
        const comments = db.prepare(`
            SELECT c.commentID, c.content, c.userID, u.username
            FROM Comment c
            JOIN User u ON c.userID = u.userID
            WHERE c.videoID = ?
            ORDER BY c.commentID DESC
        `).all(videoID);
        
        return res.json({ error: false, comments });
    } catch (err) {
        return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
    }
});

app.post('/api/comment', requireLogin, (req, res) => {
    try {
        const { videoID, content } = req.body;
        const userID = req.session.User.id;

        if (!videoID || !content) {
            return res.status(400).json({ error: true, message: 'videoID and content are required.' });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ error: true, message: 'Comment cannot be empty.' });
        }

        const stmt = db.prepare('INSERT INTO Comment (content, userID, videoID) VALUES (?, ?, ?)');
        const info = stmt.run(content, userID, videoID);

        return res.status(201).json({
            error: false,
            message: 'Comment posted successfully.',
            commentID: info.lastInsertRowid
        });
    } catch (err) {
        return res.status(500).json({ error: true, message: 'Server error: ' + err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});