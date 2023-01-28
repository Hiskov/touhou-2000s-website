import {Gapless5} from "./gapless5.js"

var player = new Gapless5({loop:true});
var song_file_name = "touhou_2000s_audio.wav";

var imgzone = document.getElementById("imgzone_vid");
var synth = document.getElementById("synth");
var synth_echo = document.getElementById("synth-echo");
var bass = document.getElementById("bass");
var snare = document.getElementById("snare");
var snare2 = document.getElementById("snare-2");
var kick = document.getElementById("kick");

var timer = document.querySelector(".audio-player .timer");

var title_song = document.querySelector(".audio-player .song-name");

var seeking_bar = document.querySelector(".audio-player .seeking-bar");


var play_btn = document.querySelector(".audio-player .play");
var pause_btn = document.querySelector(".audio-player .pause");
var stop_btn = document.querySelector(".audio-player .stop");

var repeat_btn = document.querySelector(".audio-player .repeat");

var volume_bar = document.querySelector(".audio-player .volume-bar");

var audio_length;
var is_reapeating;
var play_flag;
var all_loaded;
var is_seeking;



/* INIT */
function init(){
    is_reapeating = true;
    play_flag = false;
    all_loaded = true

    volume_bar.value = 25;
    seekVolume();

    player.addTrack(`assets/${song_file_name}`)
    //var audio_length = document.getElementById("audio_source").duration*1000;
    audio_length = 40000;
    displaySongName();

    is_seeking = false;
    seeking_bar.max = audio_length;
    seeking_bar.step = 1;   //(60.0/95.0)*1000

    pause();
    seekAudio(0);
}

init();



/*
    Video Controls
*/
function play(){
    if(!all_loaded){
        play_flag = true;
    }
    else{
        realplay();
    }
}
function realplay(){ // carrément
    player.play();
    playsTracks();
    timer.classList.remove("pause");
}
function pause(){
    player.pause();
    pauseTracks();
    timer.classList.add("pause");
}
function stop(){
    player.stop(true);
    stopTracks();
    timer.classList.remove("pause");
}



/*
    Tracks
*/

function oncanplaythroughRoutine(){
    console.log("canplaythrough");
    if(play_flag){
        realplay();
        play_flag = false;
        all_loaded = true;
    }
}
snare2.oncanplaythrough = oncanplaythroughRoutine;


function setTimeTracks(time){
    imgzone.currentTime = time;
    synth.currentTime = time;
    synth_echo.currentTime = time;
    bass.currentTime = time;
    snare.currentTime = time;
    kick.currentTime = time;
    snare2.currentTime = time;
}
function playsTracks(){
    imgzone.play();
    synth.play();
    synth_echo.play();
    bass.play();
    snare.play();
    kick.play();
    snare2.play();
}
function pauseTracks(){
    imgzone.pause();
    synth.pause();
    synth_echo.pause();
    bass.pause();
    snare.pause();
    kick.pause();
    snare2.pause();
}
function stopTracks(){
    pauseTracks();
    setTimeTracks(0);
}



/*
    Timer
*/
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
function displaySongName(){
    let text = `${song_file_name} (${formatTime(audio_length/1000)})`.toUpperCase();
    title_song.innerHTML = text;
    title_song.classList.remove("set-volume")
}

function displayVolume(volume_pourcent){
    title_song.innerHTML = `VOLUME: ${volume_pourcent}%`;
    title_song.classList.add("set-volume")
}


/*
    Seeking Bar
*/
function seekAudio(seeking_bar_value) {
    is_seeking = true;
    player.setPosition(seeking_bar_value);
    setTimeTracks(seeking_bar_value/1000.0);
    setTimer(seeking_bar_value/1000);
    is_seeking = false;
}

seeking_bar.addEventListener("change", function(){
    if(seeking_bar.value != 0){
        play();
    }
    else{
        realplay();
    }
});
seeking_bar.addEventListener("input", function(){
    pause();
    all_loaded = false;
    if( seeking_bar.value <= seeking_bar.max-seeking_bar.step){
        seekAudio(seeking_bar_value)
    }
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
// PLAY
play_btn.addEventListener("click", function(){
    play();
});

// PAUSE
pause_btn.addEventListener("click", function(){
    if(player.isPlaying()){
        pause();
    }
    else{
        play();
    }
});

// STOP
stop_btn.addEventListener("click", function(){
    stop();
});


/*
    Reapeat
*/
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
function seekVolume() {
    let vol = volume_bar.value;
    if(vol <= volume_bar.max*1){
        player.setVolume(vol/100);
        volume_bar.style.backgroundPosition = `0px ${-15*Math.floor(27*(vol/100))}px`
        displayVolume(vol);
    }
}

volume_bar.addEventListener("change", function(){
    displaySongName();
});
volume_bar.addEventListener("input", function(){
    seekVolume();
});