import {Gapless5} from "./gapless5.js"

var player = new Gapless5({loop:true});
var song_file_name = "touhou_2000s_audio.mp3";
player.addTrack(`assets/${song_file_name}`)
var audio_length = document.getElementById("audio_source").duration*1000;


/*
    Tracks
*/
var imgzone = document.getElementById("imgzone_vid");
var synth = document.getElementById("synth");
var synth_echo = document.getElementById("synth-echo");
var bass = document.getElementById("bass");
var snare = document.getElementById("snare");
var kick = document.getElementById("kick");

function setTimeTracks(time){
    imgzone.currentTime = time;
    synth.currentTime = time;
    synth_echo.currentTime = time;
    bass.currentTime = time;
    snare.currentTime = time;
    kick.currentTime = time;
}
function playsTracks(){
    imgzone.play();
    synth.play();
    synth_echo.play();
    bass.play();
    snare.play();
    kick.play();
}
function pauseTracks(){
    imgzone.pause();
    synth.pause();
    synth_echo.pause();
    bass.pause();
    snare.pause();
    kick.pause();
}
function stopTracks(){
    pauseTracks();
    setTimeTracks(0);
}


/*
    Timer
*/
var timer = document.querySelector(".audio-player .timer");

function formatTime(total_sec){
    total_sec = Math.floor(total_sec);
    let sec = total_sec%60;
    let min = Math.floor(total_sec/60);

    if (min < 10) {
        min = `0${min}`;
    }
    if (sec < 10) {
        sec = `0${sec}`;
    }
    return `${min}:${sec}`;
}

function setTimer(total_sec){
    timer.innerHTML = formatTime(total_sec);
}


/*
    Title Song Display
*/
var title_song = document.querySelector(".audio-player .song-name");

function displaySongName(){
    let text = `${song_file_name} (${formatTime(audio_length/1000)})`.toUpperCase();
    title_song.innerHTML = text;
    title_song.classList.remove("set-volume")
    console.log("MUKYUUUUU");
}

function displayVolume(volume_pourcent){
    title_song.innerHTML = `VOLUME: ${volume_pourcent}%`;
    title_song.classList.add("set-volume")
}

displaySongName();


/*
    Seeking Bar
*/
var seeking_bar = document.querySelector(".audio-player .seeking-bar");
var is_seeking = false;
seeking_bar.max = audio_length;
seeking_bar.step = 1;   //(60.0/95.0)*1000

function seekAudio() {
    if(seeking_bar.value <= seeking_bar.max-seeking_bar.step){
        is_seeking = true;
        player.setPosition(seeking_bar.value);
        setTimeTracks(seeking_bar.value/1000);
        setTimer(seeking_bar.value/1000);
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
        setTimer(player.getPosition()/1000);
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


/*
    Reapeat
*/
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


/*
    Volume
*/
var volume_bar = document.querySelector(".audio-player .volume-bar");

function seekVolume() {
    let vol = volume_bar.value;
    if(vol <= volume_bar.max*1){
        player.setVolume(vol/100);
        volume_bar.style.backgroundPosition = `0px ${-15*Math.floor(27*(vol/100))}px`
        displayVolume(vol);
        console.log("AAAAA");
    }
}

volume_bar.addEventListener("change", function(){
    displaySongName();
});
volume_bar.addEventListener("input", function(){
    seekVolume();
});






/* INIT */
function init(){
    volume_bar.value = 25;
    seekVolume();
    displaySongName()
}

init();