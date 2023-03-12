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

router.get("/armpits", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/armpits.html'));
});

router.get("/club-ibuki", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/club-ibuki.html'));
});

router.get("/lunatic-red-eyes", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/lunatic-red-eyes.html'));
});

router.get("/yuuka-shrine", function (req, res) {
    res.sendFile(path.join(__dirname, 'public/yuuka-shrine.html'));
});

module.exports = router;