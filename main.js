import {Gapless5} from "./gapless5.js"

var player = new Gapless5({loop:true});
player.addTrack("assets/touhou_2000s_audio.mp3")
var audio_length = document.getElementById("audio_source").duration*1000;

var imgzone = document.getElementById("imgzone_vid");


/*
    Seeking Bar
*/
var seeking_bar = document.querySelector(".audio-player .seeking-bar");
var isSeeking = false;
seeking_bar.max = audio_length;
seeking_bar.step = (60.0/95.0)*1000

function seekAudio() {
  isSeeking = true;
  player.setPosition(seeking_bar.value);
  imgzone.currentTime = (seeking_bar.value)/1000;
  isSeeking = false;
}

seeking_bar.addEventListener("change", function(){
    seekAudio();
});
seeking_bar.addEventListener("input", function(){
    seekAudio();
});

player.ontimeupdate = () => {
    if (!isSeeking) {
        seeking_bar.value = player.getPosition();
    }
}


/*
    Actions
*/
function playSources(){
    player.play();
    imgzone.play();
}

var play_btn = document.querySelector(".audio-player .play");
var pause_btn = document.querySelector(".audio-player .pause");
var stop_btn = document.querySelector(".audio-player .stop");

play_btn.addEventListener("click", function(){
    playSources();
    player.setVolume(0.3);
});

pause_btn.addEventListener("click", function(){
  if(player.isPlaying()){
    player.pause();
    imgzone.pause();
  }
  else{
    playSources();
  }
});

stop_btn.addEventListener("click", function(){
    player.stop();
    imgzone.pause();
    imgzone.currentTime = 0;
});

/* Reapeat */
var repeat_btn = document.querySelector(".audio-player .repeat");
var isReapeating = true;

repeat_btn.addEventListener("click", function(){
    if(isReapeating){
        repeat_btn.classList.remove("selected");
    }
    else{
        repeat_btn.classList.add("selected");
    }
    player.loop = !player.loop;
    isReapeating = !isReapeating;
})

player.onfinishedtrack = () => {
    if(isReapeating){
        imgzone.currentTime = 0;
    }
}