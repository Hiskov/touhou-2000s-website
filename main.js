import {Gapless5} from "./gapless5.js"

var player = new Gapless5({loop:true});
player.addTrack("assets/touhou_2000s_audio.mp3")
var audio_length = document.getElementById("audio_source").duration*1000;

/* Tracks */
var imgzone = document.getElementById("imgzone_vid");
var synth = document.getElementById("synth");

function setTimeTracks(time){
    imgzone.currentTime = time;
    synth.currentTime = time;
}
function playsTracks(){
    imgzone.play();
    synth.play();
}
function pauseTracks(){
    imgzone.pause();
    synth.pause();
}
function stopTracks(){
    pauseTracks();
    setTimeTracks(0);
}


/* Timer */
var timer = document.querySelector(".audio-player .timer");

function setTime(total_sec){
    let sec = total_sec%60;
    let min = Math.floor(total_sec/60);

    if (min < 10) {
        min = `0${min}`;
    }
    if (sec < 10) {
        sec = `0${sec}`;
    }

    timer.innerHTML = `${min}:${sec}`;
}


/*
    Seeking Bar
*/
var seeking_bar = document.querySelector(".audio-player .seeking-bar");
var is_seeking = false;
seeking_bar.max = audio_length;
seeking_bar.step = 1//(60.0/95.0)*1000

function seekAudio() {
    if(seeking_bar.value <= seeking_bar.max-seeking_bar.step){
        is_seeking = true;
        player.setPosition(seeking_bar.value);
        setTimeTracks((seeking_bar.value)/1000);
        is_seeking = false;
    }
}

seeking_bar.addEventListener("change", function(){
    seekAudio();
});
seeking_bar.addEventListener("input", function(){
    seekAudio();
});

player.ontimeupdate = () => {
    if (!is_seeking) {
        seeking_bar.value = player.getPosition();
        setTime(Math.floor(player.getPosition()/1000));
    }
}


/*
    Actions
*/
var play_btn = document.querySelector(".audio-player .play");
var pause_btn = document.querySelector(".audio-player .pause");
var stop_btn = document.querySelector(".audio-player .stop");

// PLAY
function play(){
    player.play();
    playsTracks();
    player.setVolume(0.3);
    timer.classList.remove("pause");
}
play_btn.addEventListener("click", function(){
    play();
});

// PAUSE
function pause(){
    player.pause();
    pauseTracks();
    timer.classList.add("pause");
}
pause_btn.addEventListener("click", function(){
    if(player.isPlaying()){
        pause();
    }
    else{
        play();
    }
});

// STOP
function stop(){
    player.stop(true);
    stopTracks();
    timer.classList.remove("pause");
}

stop_btn.addEventListener("click", function(){
    stop();
});


/* Reapeat */
var repeat_btn = document.querySelector(".audio-player .repeat");
var is_reapeating = true;

repeat_btn.addEventListener("click", function(){
    if(is_reapeating){
        repeat_btn.classList.remove("selected");
    }
    else{
        repeat_btn.classList.add("selected");
    }
    player.loop = !player.loop;
    is_reapeating = !is_reapeating;
})

player.onfinishedtrack = () => {
    if(is_reapeating){
        setTimeTracks(0);
    }
}