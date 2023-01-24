var isSeeking = false;
var seek = document.getElementById("position");
var player = document.getElementById("player");
var imgzone = document.getElementById("imgzone_vid");

function setupSeek() {
  seek.max = Math.floor(player.duration);
}

function seekAudio() {
  isSeeking = true;
  player.currentTime = seek.value;
  imgzone.currentTime = seek.value;
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

function clickPlay(){
    player.play();
    imgzone.play();
    player.volume = 0.1;
}
function clickPause(){
  if(!player.paused){
    player.pause();
    imgzone.pause();
  }
  else{
    clickPlay();
  }
}
function clickStop(){
    player.pause();
    player.currentTime = 0;
    imgzone.pause();
    imgzone.currentTime = 0;
}



