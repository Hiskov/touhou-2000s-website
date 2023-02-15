const express = require("express");
const router = express.Router();
const path = require('path');

// Home
router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Eirin HELP
router.get("/help", function (req, res) {
    res.sendFile(path.join(__dirname, '/eirin.html'));
});

module.exports = router;