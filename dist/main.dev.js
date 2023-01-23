"use strict";

var isSeeking = false;
var seek = document.getElementById("position");
var player = document.getElementById("player");

function setupSeek() {
  seek.max = player.duration;
}

function seekAudio() {
  isSeeking = true;
  player.currentTime = seek.value;
  isSeeking = false;
}

function initProgressBar() {
  if (!isSeeking) {
    seek.value = player.currentTime;
  }
}

var play = document.querySelector(".audio-player .actions .play");
var pause = document.querySelector(".audio-player .actions .pause");
var stop = document.querySelector(".audio-player .actions .stop");

function clickPlay() {
  player.play();
}

function clickPause() {
  player.pause();
}

function clickStop() {
  player.pause();
  player.currentTime = 0;
}