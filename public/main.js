import {Gapless5} from "./gapless5.js"

var DOMAIN_URL = "http://127.0.0.1:80"

var enter_screen = document.getElementById("enter-screen");

var player = new Gapless5({loop:true});
var song_file_name = "touhou-2000s-fanpage-ytpmv-audio.wav";

var imgzone = document.getElementById("imgzone-vid");
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
var videos = [synth, synth_echo, imgzone, bass, snare, snare2, kick, hi_hat, strings1, strings2, strings3, cirno]

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
var realplay_flag;
var is_seeking;
var in_enter_screen;


/* INIT */
function init(){
    addTrackListener();

    is_reapeating = true;
    play_flag = false;
    realplay_flag = false;

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

    in_enter_screen = true;
}

function restart_gif(){
    var imgs = document.querySelectorAll("img");
    imgs.forEach(function(img) {
        let src = img.src;
        img.src = "";
        img.src = src;
    })
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }




init();



/*
    "Enter" Screen
*/
var enter_btn = document.querySelector("#enter-screen .enter-btn");

var firstAllVideoLoadedPromiseResolve;
var firstAllVideoLoadedPromise = new Promise(function(resolve){
    firstAllVideoLoadedPromiseResolve = resolve;
});
function addTrackListener(){
    var len = videos.length;
    var loaded = new Array(len).fill(0);
    videos.forEach(function(v, i){
        v.addEventListener('canplaythrough', function(){
            loaded[i] = 1;
            if (arraysEqual(loaded, new Array(len).fill(1))){
                oncanplaythroughRoutine();
                firstAllVideoLoadedPromiseResolve();
                loaded = new Array(len).fill(0);
            }
        });
    });
}

Promise.all(
    Array(firstAllVideoLoadedPromise).concat(
    Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })))).then(() => {
    enter_btn.innerHTML = "ENTER";
    enter_btn.classList.add("ckickable");
    enter_btn.addEventListener("click", function(){
        enter_screen.classList.add("disable");
        in_enter_screen = false;
        restart_gif();
        play();
    });
});


/*
    7 Colored Puppeteer
*/
var color_nb = document.querySelector("#seven-color-alice .color-nb");
var color_slider = document.querySelector("#seven-color-alice .color-slider");
var alice = document.querySelector("#seven-color-alice .alice");
color_slider.addEventListener("input", function(){
    color_nb.innerHTML = color_slider.value;
    alice.src = `assets/alice/alice${color_slider.value}.png`;
});


/*
    Rumia Light
*/
var rumia = document.querySelector("#rumia-light .rumia");
var light_slider = document.querySelector("#rumia-light .light-slider");
light_slider.addEventListener("input", function(){
    rumia.style.opacity = `${light_slider.value}%`;
});




/*
    Video Controls
*/
function play(){
    if(!player.isPlaying() && !play_flag){
        if(!realplay_flag){
            play_flag = true;
            seekAudio(seeking_bar.value);
            displayLoading();
        }
        else{
            realplay();
            realplay_flag = false;
        }
    }
}
function realplay(){ // carrément
    //setTimeTracks(player.currentPosition*1000);
    playsTracks();
    player.play();
    displaySongName();
    timer.classList.remove("pause");
}
function pause(){
    if(!play_flag){
        play_flag = false;
        player.pause();
        pauseTracks();
        timer.classList.add("pause");
    }
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
    realplay_flag = true;
    if(play_flag){
        realplay();
        play_flag = false;
        realplay_flag = false;
    }
}


function setTimeTracks(time){
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
function playsTracks(){
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
function pauseTracks(){
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
function stopTracks(){
    pauseTracks();
    seekAudio(0);
    seeking_bar.value = player.getPosition();
}


function syncTracks(){
    var threshold = 50; //ms
    if(!document.hidden){
        videos.every(function(v){
            var offset = Math.abs(v.currentTime*1000 - player.getPosition());
            if(offset > threshold){
                console.log(`SYNC: ${v.id} ${offset}`);
                new Promise((resolve) => {
                    pause();
                    setTimeout(resolve, 1);
                }).then(function(){
                    play();
                });
                //v.currentTime = player.getPosition()/1000;
                return false;
            }
            return true;
        })
    }
} 

window.setInterval(function(){
    syncTracks();
}, 1000);



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
    title_song.classList.replace("set-volume", "base");
    title_song.classList.replace("loading", "base");
}

function displayVolume(volume_pourcent){
    title_song.innerHTML = `VOLUME: ${volume_pourcent}%`;
    title_song.classList.replace("base", "set-volume");
}

function displayLoading(){
    title_song.innerHTML = `LOADING...`;
    title_song.classList.replace("base", "loading");
}


/*
    Seeking Bar
*/
function seekAudio(seek_value) {
    realplay_flag = false;
    is_seeking = true;
    setTimeTracks(seek_value/1000.0);
    setTimer(seek_value/1000);
    player.setPosition(seek_value);
    is_seeking = false;
}

seeking_bar.addEventListener("change", function(){
    if(player.isPlaying()){
        pause();
        if(seeking_bar.value != 0){
            play();
        }
        else{
            play();
            //oncanplaythroughRoutine();
        }
    }
});
seeking_bar.addEventListener("input", function(){
    if( seeking_bar.value <= seeking_bar.max-seeking_bar.step){
        seekAudio(seeking_bar.value);
    }
});


player.ontimeupdate = function(){
    if(player.getPosition() < seeking_bar.max-seeking_bar.step){
        if (!is_seeking) {
            seeking_bar.value = player.getPosition();
            setTimer(player.getPosition()/1000);
        }
    }
}


/*
    Actions
*/
// PLAY
play_btn.addEventListener("click", function(){
    play();
    this.blur();
});

// PAUSE
function pauseAction(){
    if(player.isPlaying()){
        pause();
    }
    else{
        play();
    }
}
pause_btn.addEventListener("click", function(){
    pauseAction();
    this.blur();
});

// STOP
stop_btn.addEventListener("click", function(){
    stop();
    this.blur();
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



/*
    Yagokoro Help Center
*/
var yagokoro_help_close_btn_ = document.querySelector("#yagokoro-help button");
yagokoro_help_close_btn_.addEventListener("click", function(){
  var popup = document.querySelector("#yagokoro-help");
  popup.classList.add("closed");
});



/*
    HOTKEYS
*/

// Handlers
function keyup_handler(e) {
    if(!in_enter_screen){
        if(e.key === ' ') {
            pauseAction();
        }
    }
}
function keydown_handler(e) {
    if(!in_enter_screen){
        if(e.key === ' ' && e.target == document.body) {
            e.preventDefault();
        }
        if(e.key === 'F1'){
            e.preventDefault();
            pause();
            window.open(`${DOMAIN_URL}/help`, "_blank");
        }
    }
}

document.addEventListener('keyup', keyup_handler, false);
document.addEventListener('keydown', keydown_handler, false);
var all_a = document.querySelectorAll("a");
all_a.forEach(function(a){
    a.addEventListener("mousedown", function(){
        if(a.target === "_blank"){
            pause();
        }
    });
})