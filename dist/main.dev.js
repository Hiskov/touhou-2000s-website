"use strict";

var _gapless = require("./gapless5.js");

var enter_screen = document.getElementById("enter-screen");
var player = new _gapless.Gapless5({
  loop: true
});
var song_file_name = "touhou_2000s_fanpage_ytpmv_audio.mp3";
var imgzone = document.getElementById("imgzone_vid");
var synth = document.getElementById("synth");
var synth_echo = document.getElementById("synth-echo");
var bass = document.getElementById("bass");
var snare = document.getElementById("snare1");
var snare2 = document.getElementById("snare2");
var kick = document.getElementById("kick");
var hi_hat = document.getElementById("hi-hat");
var strings1 = document.getElementById("strings1");
var strings2 = document.getElementById("strings2");
var strings3 = document.getElementById("strings3");
var cirno = document.getElementById("cirno");
var timer = document.querySelector(".audio-player .timer");
var title_song = document.querySelector(".audio-player .song-name");
var seeking_bar = document.querySelector(".audio-player .seeking-bar");
var play_btn = document.querySelector(".audio-player .play");
var pause_btn = document.querySelector(".audio-player .pause");
var stop_btn = document.querySelector(".audio-player .stop");
var repeat_btn = document.querySelector(".audio-player .repeat-btn");
var volume_bar = document.querySelector(".audio-player .volume-bar");
var audio_length;
var is_reapeating;
var play_flag;
var all_loaded;
var is_seeking;
var in_enter_screen;
/* INIT */

function init() {
  is_reapeating = true;
  play_flag = false;
  all_loaded = true;
  volume_bar.value = 25;
  seekVolume();
  player.addTrack("assets/".concat(song_file_name)); //var audio_length = document.getElementById("audio_source").duration*1000;

  audio_length = 40000;
  displaySongName();
  is_seeking = false;
  seeking_bar.max = audio_length;
  seeking_bar.step = 1; //(60.0/95.0)*1000

  pause();
  seekAudio(0);
  in_enter_screen = false;
}

init();
/*
    "Enter" Screen
*/

/*
var enter_btn = document.querySelector("#enter-screen .enter-btn");
enter_btn.addEventListener("click", function(){
    enter_screen.classList.add("disable");
    in_enter_screen = false;
    play();
});
*/

/*
    7 Colored Puppeteer
*/

var color_nb = document.querySelector("#seven-color-alice .color-nb");
var color_slider = document.querySelector("#seven-color-alice .color-slider");
var alice = document.querySelector("#seven-color-alice .alice");
color_slider.addEventListener("input", function () {
  color_nb.innerHTML = color_slider.value;
  alice.src = "assets/alice/alice".concat(color_slider.value, ".png");
});
/*
    Video Controls
*/

function play() {
  if (!player.isPlaying() && !play_flag) {
    play_flag = true;
    seekAudio(seeking_bar.value);
    displayLoading();
  }
}

function realplay() {
  // carr??ment
  player.play();
  playsTracks();
  displaySongName();
  timer.classList.remove("pause");
}

function pause() {
  if (!play_flag) {
    play_flag = false;
    player.pause();
    pauseTracks();
    timer.classList.add("pause");
  }
}

function stop() {
  player.stop(true);
  stopTracks();
  timer.classList.remove("pause");
}
/*
    Tracks
*/


function oncanplaythroughRoutine() {
  if (play_flag) {
    realplay();
    play_flag = false;
    all_loaded = true;
  }
}

snare2.oncanplaythrough = oncanplaythroughRoutine;

function setTimeTracks(time) {
  imgzone.currentTime = time;
  synth.currentTime = time;
  synth_echo.currentTime = time;
  bass.currentTime = time;
  snare.currentTime = time;
  kick.currentTime = time;
  snare2.currentTime = time;
  hi_hat.currentTime = time;
  telephone.currentTime = time;
  strings1.currentTime = time;
  strings2.currentTime = time;
  strings3.currentTime = time;
  cirno.currentTime = time;
}

function playsTracks() {
  imgzone.play();
  synth.play();
  synth_echo.play();
  bass.play();
  snare.play();
  kick.play();
  snare2.play();
  hi_hat.play();
  telephone.play();
  strings1.play();
  strings2.play();
  strings3.play();
  cirno.play();
}

function pauseTracks() {
  imgzone.pause();
  synth.pause();
  synth_echo.pause();
  bass.pause();
  snare.pause();
  kick.pause();
  snare2.pause();
  hi_hat.pause();
  telephone.pause();
  strings1.pause();
  strings2.pause();
  strings3.pause();
  cirno.pause();
}

function stopTracks() {
  pauseTracks();
  setTimeTracks(0);
}
/*
    Timer
*/


function formatTime(total_sec) {
  total_sec = Math.floor(total_sec);
  var sec = total_sec % 60;
  var min = Math.floor(total_sec / 60);

  if (min < 10) {
    min = "0".concat(min);
  }

  if (sec < 10) {
    sec = "0".concat(sec);
  }

  return "".concat(min, ":").concat(sec);
}

function setTimer(total_sec) {
  timer.innerHTML = formatTime(total_sec);
}
/*
    Title Song Display
*/


function displaySongName() {
  var text = "".concat(song_file_name, " (").concat(formatTime(audio_length / 1000), ")").toUpperCase();
  title_song.innerHTML = text;
  title_song.classList.replace("set-volume", "base");
  title_song.classList.replace("loading", "base");
}

function displayVolume(volume_pourcent) {
  title_song.innerHTML = "VOLUME: ".concat(volume_pourcent, "%");
  title_song.classList.replace("base", "set-volume");
}

function displayLoading() {
  title_song.innerHTML = "LOADING...";
  title_song.classList.replace("base", "loading");
}
/*
    Seeking Bar
*/


function seekAudio(seek_value) {
  all_loaded = false;
  is_seeking = true;
  player.setPosition(seek_value);
  setTimeTracks(seek_value / 1000.0);
  setTimer(seek_value / 1000);
  is_seeking = false;
}

seeking_bar.addEventListener("change", function () {
  if (player.isPlaying()) {
    pause();

    if (seeking_bar.value != 0) {
      play();
    } else {
      play();
      oncanplaythroughRoutine();
    }
  }
});
seeking_bar.addEventListener("input", function () {
  if (seeking_bar.value <= seeking_bar.max - seeking_bar.step) {
    seekAudio(seeking_bar.value);
  }
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
// PLAY


play_btn.addEventListener("click", function () {
  play();
  this.blur();
}); // PAUSE

function pauseAction() {
  if (player.isPlaying()) {
    pause();
  } else {
    play();
  }
}

pause_btn.addEventListener("click", function () {
  pauseAction();
  this.blur();
}); // STOP

stop_btn.addEventListener("click", function () {
  stop();
  this.blur();
});
/*
    Reapeat
*/

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


function seekVolume() {
  var vol = volume_bar.value;

  if (vol <= volume_bar.max * 1) {
    player.setVolume(vol / 100);
    volume_bar.style.backgroundPosition = "0px ".concat(-15 * Math.floor(27 * (vol / 100)), "px");
    displayVolume(vol);
  }
}

volume_bar.addEventListener("change", function () {
  displaySongName();
});
volume_bar.addEventListener("input", function () {
  seekVolume();
});
/*
    HOTKEYS
*/
// Handlers

function keyup_handler(e) {
  if (!in_enter_screen) {
    if (e.key === ' ') {
      pauseAction();
    }
  }
}

function keydown_handler(e) {
  if (!in_enter_screen) {
    if (e.key === ' ' && e.target == document.body) {
      e.preventDefault();
    }
  }
}

document.addEventListener('keyup', keyup_handler, false); //document.addEventListener('keydown', keydown_handler, false);