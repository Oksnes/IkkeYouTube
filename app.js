const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const database = require('better-sqlite3')
const db = new database('ikkeyoutube.db');

require('dotenv').config();

const app = express();
const port = 3000;

db.prepare(`
-- User table
CREATE TABLE IF NOT EXISTS User (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profilePicture TEXT,
    description TEXT
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

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 60 * 24 } // 1 day
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
