const express = require("express");
const router = express.Router();
const path = require('path');

// Home
router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Eirin HELP
router.get("/help", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/eirin.html'));
});

router.get("/thegap", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/thegap.html'));
});

module.exports = router;