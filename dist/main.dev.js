"use strict";

var _gapless = require("./gapless5.js");

var player = new _gapless.Gapless5({
  loop: true
});
player.addTrack("assets/touhou_2000s_audio.mp3");
var audio_length = document.getElementById("audio_source").duration * 1000;
/*
    Tracks
*/

var imgzone = document.getElementById("imgzone_vid");
var synth = document.getElementById("synth");

function setTimeTracks(time) {
  imgzone.currentTime = time;
  synth.currentTime = time;
}

function playsTracks() {
  imgzone.play();
  synth.play();
}

function pauseTracks() {
  imgzone.pause();
  synth.pause();
}

function stopTracks() {
  pauseTracks();
  setTimeTracks(0);
}
/*
    Timer
*/


var timer = document.querySelector(".audio-player .timer");

function setTimer(total_sec) {
  total_sec = Math.floor(total_sec);
  var sec = total_sec % 60;
  var min = Math.floor(total_sec / 60);

  if (min < 10) {
    min = "0".concat(min);
  }

  if (sec < 10) {
    sec = "0".concat(sec);
  }

  timer.innerHTML = "".concat(min, ":").concat(sec);
}
/*
    Seeking Bar
*/


var seeking_bar = document.querySelector(".audio-player .seeking-bar");
var is_seeking = false;
seeking_bar.max = audio_length;
seeking_bar.step = 1; //(60.0/95.0)*1000

function seekAudio() {
  if (seeking_bar.value <= seeking_bar.max - seeking_bar.step) {
    is_seeking = true;
    player.setPosition(seeking_bar.value);
    setTimeTracks(seeking_bar.value / 1000);
    setTimer(seeking_bar.value / 1000);
    is_seeking = false;
  }
}

seeking_bar.addEventListener("change", function () {
  seekAudio();
});
seeking_bar.addEventListener("input", function () {
  seekAudio();
});

player.ontimeupdate = function () {
  if (!is_seeking) {
    seeking_bar.value = player.getPosition();
    setTimer(player.getPosition() / 1000);
  }
};
/*
    Actions
*/


var play_btn = document.querySelector(".audio-player .play");
var pause_btn = document.querySelector(".audio-player .pause");
var stop_btn = document.querySelector(".audio-player .stop"); // PLAY

function play() {
  player.play();
  playsTracks();
  timer.classList.remove("pause");
}

play_btn.addEventListener("click", function () {
  play();
}); // PAUSE

function pause() {
  player.pause();
  pauseTracks();
  timer.classList.add("pause");
}

pause_btn.addEventListener("click", function () {
  if (player.isPlaying()) {
    pause();
  } else {
    play();
  }
}); // STOP

function stop() {
  player.stop(true);
  stopTracks();
  timer.classList.remove("pause");
}

stop_btn.addEventListener("click", function () {
  stop();
});
/*
    Reapeat
*/

var repeat_btn = document.querySelector(".audio-player .repeat");
var is_reapeating = true;
repeat_btn.addEventListener("click", function () {
  if (is_reapeating) {
    repeat_btn.classList.remove("selected");
  } else {
    repeat_btn.classList.add("selected");
  }

  player.loop = !player.loop;
  is_reapeating = !is_reapeating;
});

player.onfinishedtrack = function () {
  if (is_reapeating) {
    setTimeTracks(0);
  }
};
/*
    Volume
*/


var volume_bar = document.querySelector(".audio-player .volume-bar");

function seekVolume() {
  var vol = volume_bar.value;

  if (vol <= volume_bar.max * 1) {
    player.setVolume(vol / 100);
    console.log(vol);
    volume_bar.style.backgroundPosition = "0px ".concat(-15 * Math.floor(27 * (vol / 100)), "px");
  }
}

volume_bar.addEventListener("change", function () {
  seekVolume();
});
volume_bar.addEventListener("input", function () {
  seekVolume();
});
/* INIT */

function init() {
  volume_bar.value = 25;
  seekVolume();
}

init();