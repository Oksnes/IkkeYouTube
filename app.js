const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const database = require('better-sqlite3')
const db = new database('ikkeyoutube.db');
const multer = require('multer');
const path = require('path');

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

    req.session.User = { id: User.userID, Username: User.username, Admin: User.admin || 'false' };
    res.json({ error: false, message: 'Login successful.' });
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});