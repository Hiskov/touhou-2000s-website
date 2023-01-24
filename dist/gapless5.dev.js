"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Gapless5 = Gapless5;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/*
 *
 * Gapless 5: Gapless JavaScript/CSS audio player for HTML5
 *
 * Version 1.3.16
 * Copyright 2014 Rego Sen
 *
*/
// PROBLEM: We have 2 APIs for playing audio through the web, and both of them have problems:
//  - HTML5 Audio: the last chunk of audio gets cut off, making gapless transitions impossible
//  - WebAudio: can't play a file until it's fully loaded
// SOLUTION: Use both!
// If WebAudio hasn't loaded yet, start playback with HTML5 Audio.  Then seamlessly switch to WebAudio once it's loaded.
var gapless5Players = {};
var Gapless5State = {
  None: 0,
  Loading: 1,
  Starting: 2,
  Play: 3,
  Stop: 4,
  Error: 5
};
var LogLevel = {
  Debug: 1,
  // show log.debug and up
  Info: 2,
  // show log.info and up
  Warning: 3,
  // show log.warn and up
  Error: 4,
  // show log.error and up
  None: 5 // show nothing

};
var CrossfadeShape = {
  None: 1,
  // plays both tracks at full volume
  Linear: 2,
  EqualPower: 3
}; // A Gapless5Source "class" handles track-specific audio requests

function Gapless5Source(parentPlayer, parentLog, inAudioPath) {
  var _this = this;

  this.audioPath = inAudioPath;
  this.trackName = inAudioPath.replace(/^.*[\\/]/, '').split('.')[0];
  var player = parentPlayer;
  var log = parentLog; // HTML5 Audio

  var audio = null; // WebAudio

  var source = null;
  var buffer = null;
  var request = null;
  var gainNode = null; // states

  var lastTick = 0;
  var position = 0;
  var endpos = 0;
  var queuedState = Gapless5State.None;
  var state = Gapless5State.None;
  var loadedPercent = 0;
  var endedCallback = null;
  var volume = 1; // source-specific volume (for cross-fading)

  var crossfadeIn = 0;
  var crossfadeOut = 0;

  this.setCrossfade = function (amountIn, amountOut) {
    var resetEndedCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    crossfadeIn = amountIn;
    crossfadeOut = amountOut;

    if (endpos > 0) {
      if (crossfadeIn + crossfadeOut > endpos) {
        log.warn("Crossfades add up to longer than duration (".concat(crossfadeIn + crossfadeOut, " > ").concat(endpos, "), clamping"));
        crossfadeIn = Math.min(amountIn, endpos / 2);
        crossfadeOut = Math.min(amountOut, endpos / 2);
      }
    }

    if (resetEndedCallback) {
      setEndedCallbackTime((endpos - position) / 1000);
    }
  };

  this.calcFadeAmount = function (percent) {
    var clamped = Math.max(0, Math.min(1, percent));

    if (player.crossfadeShape === CrossfadeShape.Linear) {
      return 1 - clamped;
    }

    if (player.crossfadeShape === CrossfadeShape.EqualPower) {
      return 1 - Math.sqrt(clamped);
    }

    return 0;
  };

  this.getVolume = function () {
    volume = 1;
    var actualPos = position * player.playbackRate;
    var actualEnd = endpos * player.playbackRate;

    if (actualPos < crossfadeIn) {
      volume = volume - _this.calcFadeAmount(actualPos / crossfadeIn);
    }

    var timeRemaining = actualEnd - actualPos;

    if (timeRemaining < crossfadeOut) {
      volume = volume - _this.calcFadeAmount(timeRemaining / crossfadeOut);
    }

    return Math.min(1, Math.max(0, volume * player.volume));
  };

  var setState = function setState(newState) {
    if (state !== newState && newState === Gapless5State.Play) {
      lastTick = new Date().getTime();
    }

    state = newState;
    queuedState = Gapless5State.None;
    player.uiDirty = true;
  };

  this.getState = function () {
    return state;
  };

  this.unload = function (isError) {
    _this.stop();

    setState(isError ? Gapless5State.Error : Gapless5State.None);

    if (request) {
      request.abort();
    }

    audio = null;
    source = null;
    buffer = null;
    position = 0;
    endpos = 0;

    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }

    player.onunload(_this.audioPath);
  };

  var onEnded = function onEnded() {
    if (state === Gapless5State.Play) {
      player.onEndedCallback();
    }
  };

  var parseError = function parseError(error) {
    if (error) {
      if (error.message) {
        return error.message;
      }

      if (error.target && error.target.error && error.target.error.message) {
        return error.target.error.message;
      }

      return error;
    }

    return 'Error playing Gapless 5 audio';
  };

  var onError = function onError(error) {
    var message = parseError(error);
    log.error(message);
    player.onerror(_this.audioPath, message);

    _this.unload(true);
  };

  var isErrorStatus = function isErrorStatus(status) {
    return status / 100 >= 4;
  };

  var onLoadedWebAudio = function onLoadedWebAudio(inBuffer) {
    if (!request) {
      return;
    }

    request = null;
    buffer = inBuffer;
    endpos = inBuffer.duration * 1000;

    if (!gainNode) {
      gainNode = player.context.createGain();
      gainNode.connect(player.context.destination);
    }

    gainNode.gain.value = _this.getVolume();

    if (queuedState === Gapless5State.Play && state === Gapless5State.Loading) {
      _this.setCrossfade(crossfadeIn, crossfadeOut); // re-clamp, now that endpos is reset


      playAudioFile(true);
    } else if (audio !== null && queuedState === Gapless5State.None && _this.inPlayState(true)) {
      log.debug("Switching from HTML5 to WebAudio: ".concat(_this.audioPath));
      setState(Gapless5State.Stop);

      _this.play(true);
    }

    if (state === Gapless5State.Loading) {
      state = Gapless5State.Stop;
    }

    player.onload(_this.audioPath);
    player.uiDirty = true;
  };

  var onLoadedHTML5Audio = function onLoadedHTML5Audio() {
    if (state !== Gapless5State.Loading) {
      return;
    }

    state = Gapless5State.Stop;
    endpos = audio.duration * 1000;

    if (queuedState === Gapless5State.Play) {
      _this.setCrossfade(crossfadeIn, crossfadeOut); // re-clamp, now that endpos is reset


      playAudioFile(true);
    }

    player.uiDirty = true;
  };

  this.stop = function () {
    var resetPosition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (state === Gapless5State.None) {
      return;
    }

    log.debug("Stopping: ".concat(_this.audioPath));

    if (audio) {
      audio.pause();
    }

    if (source) {
      if (endedCallback) {
        window.clearTimeout(endedCallback);
        endedCallback = null;
      }

      source.stop(0);
      source.disconnect();
    }

    setState(Gapless5State.Stop);

    if (resetPosition) {
      _this.setPosition(0);

      _this.setCrossfade(0, 0, false);
    }
  };

  var setEndedCallbackTime = function setEndedCallbackTime(restSecNormalized) {
    if (endedCallback) {
      window.clearTimeout(endedCallback);
    }

    if (_this.inPlayState(true)) {
      var restSec = Math.max(0, restSecNormalized / player.playbackRate - crossfadeOut / 1000); // not using AudioBufferSourceNode.onended or 'ended' because:
      // a) neither will trigger when looped
      // b) AudioBufferSourceNode version triggers on stop() as well

      log.debug("onEnded() will be called on ".concat(_this.audioPath, " in ").concat(restSec.toFixed(2), " sec"));
      endedCallback = window.setTimeout(onEnded, restSec * 1000, player.context.baseLatency);
    }
  };

  var getStartOffsetMS = function getStartOffsetMS(syncPosition) {
    if (syncPosition && audio) {
      // not an exact science
      return audio.currentTime * 1000 + player.tickMS + player.context.baseLatency * 2;
    }

    return position;
  };

  var playAudioFile = function playAudioFile(syncPosition) {
    if (_this.inPlayState(true)) {
      return;
    }

    position = Math.max(position, 0);

    if (!Number.isFinite(position) || position >= _this.getLength()) {
      position = 0;
    }

    var looped = player.isSingleLoop();

    if (buffer !== null) {
      setState(Gapless5State.Starting);
      player.context.resume().then(function () {
        if (state === Gapless5State.Starting) {
          gainNode.gain.value = _this.getVolume();

          if (source) {
            // stop existing AudioBufferSourceNode
            source.stop();
            source.disconnect();
          }

          source = player.context.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = player.playbackRate;
          source.loop = looped;
          source.connect(gainNode);
          var offsetSec = getStartOffsetMS(syncPosition) / 1000;
          log.debug("Playing WebAudio".concat(looped ? ' (looped)' : '', ": ").concat(_this.audioPath, " at ").concat(offsetSec.toFixed(2), " sec"));
          source.start(0, offsetSec);
          setState(Gapless5State.Play);
          player.onplay(_this.audioPath);
          setEndedCallbackTime(source.buffer.duration - offsetSec);

          if (audio) {
            audio.pause();
          }
        } else if (source) {
          // in case stop was requested while awaiting promise
          source.stop();
          source.disconnect();
        }
      });
    } else if (audio !== null) {
      var offsetSec = position / 1000;
      audio.currentTime = offsetSec;
      audio.volume = _this.getVolume();
      audio.loop = looped;
      audio.playbackRate = player.playbackRate;
      setState(Gapless5State.Starting);
      audio.play().then(function () {
        if (state === Gapless5State.Starting) {
          log.debug("Playing HTML5 Audio".concat(looped ? ' (looped)' : '', ": ").concat(_this.audioPath, " at ").concat(offsetSec.toFixed(2), " sec"));
          setState(Gapless5State.Play);
          player.onplay(_this.audioPath);
          setEndedCallbackTime(audio.duration - offsetSec);
        } else if (audio) {
          // in case stop was requested while awaiting promise
          audio.pause();
        }
      })["catch"](function (e) {
        if (e.name !== 'AbortError') {
          log.warn(e.message);
        }
      });
    }
  }; // PUBLIC FUNCTIONS


  this.inPlayState = function (checkStarting) {
    return state === Gapless5State.Play || checkStarting && state === Gapless5State.Starting;
  };

  this.isPlayActive = function (checkStarting) {
    return _this.inPlayState(checkStarting) || queuedState === Gapless5State.Play;
  };

  this.getPosition = function () {
    return position;
  };

  this.getLength = function () {
    return endpos;
  };

  this.play = function (syncPosition) {
    player.onPlayAllowed();

    if (state === Gapless5State.Loading) {
      log.debug("Loading ".concat(_this.audioPath));
      queuedState = Gapless5State.Play;
    } else {
      playAudioFile(syncPosition); // play immediately
    }
  };

  this.setPlaybackRate = function (rate) {
    if (source) {
      source.playbackRate.value = rate;
    }

    if (audio) {
      audio.playbackRate = rate;
    }

    setEndedCallbackTime((endpos - position) / 1000);
  };

  this.tick = function (updateLoopState) {
    if (state === Gapless5State.Play) {
      var nextTick = new Date().getTime();
      var elapsed = nextTick - lastTick;
      position = position + elapsed * player.playbackRate;
      lastTick = nextTick;

      if (updateLoopState) {
        var shouldLoop = player.isSingleLoop();

        if (source && source.loop !== shouldLoop) {
          source.loop = shouldLoop;
          log.debug("Setting WebAudio loop to ".concat(shouldLoop));
        }

        if (audio && audio.loop !== shouldLoop) {
          audio.loop = shouldLoop;
          log.debug("Setting HTML5 audio loop to ".concat(shouldLoop));
        }
      }

      if (audio !== null) {
        audio.volume = _this.getVolume();
      }

      if (gainNode !== null) {
        var currentTime = window.gapless5AudioContext.currentTime; // Ramping to prevent clicks
        // Not ramping for the whole fade because user can pause, set master volume, etc.

        gainNode.gain.linearRampToValueAtTime(_this.getVolume(), currentTime + player.tickMS / 1000);
      }
    }

    if (loadedPercent < 1) {
      var newPercent = 1;

      if (state === Gapless5State.Loading) {
        newPercent = 0;
      } else if (audio && audio.seekable.length > 0) {
        newPercent = audio.seekable.end(0) / audio.duration;
      }

      if (loadedPercent !== newPercent) {
        loadedPercent = newPercent;
      }
    }

    return loadedPercent;
  };

  this.setPosition = function (newPosition, bResetPlay) {
    if (bResetPlay && _this.inPlayState()) {
      _this.stop();

      position = newPosition;

      _this.play();
    } else {
      position = newPosition;
    }
  };

  var fetchBlob = function fetchBlob(audioPath, loader) {
    fetch(audioPath).then(function (r) {
      if (r.ok) {
        r.blob().then(function (blob) {
          loader(blob);
        });
      } else {
        onError(r.statusUI);
      }
    })["catch"](function (e) {
      onError(e);
    });
  };

  this.load = function () {
    if (state === Gapless5State.Loading) {
      return;
    }

    var audioPath = _this.audioPath;
    player.onloadstart(audioPath);
    state = Gapless5State.Loading;

    if (player.useWebAudio) {
      var onLoadWebAudio = function onLoadWebAudio(data) {
        if (data) {
          player.context.decodeAudioData(data).then(function (incomingBuffer) {
            onLoadedWebAudio(incomingBuffer);
          });
        }
      };

      if (audioPath.startsWith('blob:')) {
        fetchBlob(audioPath, function (blob) {
          request = new FileReader();

          request.onload = function () {
            if (request) {
              onLoadWebAudio(request.result);
            }
          };

          request.readAsArrayBuffer(blob);

          if (request.error) {
            onError(request.error);
          }
        });
      } else {
        request = new XMLHttpRequest();
        request.open('get', audioPath, true);
        request.responseType = 'arraybuffer';

        request.onload = function () {
          if (request) {
            onLoadWebAudio(request.response);
          }
        };

        request.onerror = function () {
          if (request) {
            onError('Failed to load audio track');
          }
        };

        request.onloadend = function () {
          if (request && isErrorStatus(request.status)) {
            onError('Failed to load audio track');
          }
        };

        request.send();
      }
    }

    if (player.useHTML5Audio) {
      var getHtml5Audio = function getHtml5Audio() {
        var audioObj = new Audio();
        audioObj.controls = false; // no pitch preservation, to be consistent with WebAudio:

        audioObj.preservesPitch = false;
        audioObj.mozPreservesPitch = false;
        audioObj.webkitPreservesPitch = false;
        audioObj.addEventListener('canplaythrough', onLoadedHTML5Audio, false);
        audioObj.addEventListener('error', onError, false); // TODO: switch to audio.networkState, now that it's universally supported

        return audioObj;
      };

      if (audioPath.startsWith('blob:')) {
        // TODO: blob as srcObject is not supported on all browsers
        fetchBlob(audioPath, function (blob) {
          audio = getHtml5Audio();
          audio.srcObject = blob;
          audio.load();
        });
      } else {
        audio = getHtml5Audio();
        audio.src = audioPath;
        audio.load();
      }
    }
  };
} // A Gapless5FileList "class". Processes an array of JSON song objects, taking
// the "file" members out to constitute the this.playlist.sources[] in the Gapless5 player


function Gapless5FileList(parentPlayer, parentLog, inShuffle) {
  var _this2 = this;

  var inLoadLimit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
  var inTracks = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var inStartingTrack = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  var player = parentPlayer;
  var log = parentLog; // OBJECT STATE
  // Playlist and Track Items

  this.sources = []; // List of Gapless5Sources

  this.startingTrack = 0;
  this.trackNumber = -1; // Displayed track index in GUI
  // If the tracklist ordering changes, after a pre/next song,
  // the playlist needs to be regenerated

  this.shuffledIndices = [];
  this.shuffleMode = Boolean(inShuffle); // Ordered (false) or Shuffle (true)

  this.shuffleRequest = null;
  this.preserveCurrent = true;
  this.loadLimit = inLoadLimit; // PRIVATE METHODS

  this.setStartingTrack = function (newStartingTrack) {
    if (newStartingTrack === 'random') {
      _this2.startingTrack = Math.floor(Math.random() * _this2.sources.length);
    } else {
      _this2.startingTrack = newStartingTrack || 0;
    }

    log.debug("Setting starting track to ".concat(_this2.startingTrack));
    _this2.trackNumber = _this2.startingTrack;
  };

  this.currentSource = function () {
    if (_this2.numTracks() === 0) {
      return null;
    }

    var _this2$getSourceIndex = _this2.getSourceIndexed(_this2.trackNumber),
        source = _this2$getSourceIndex.source;

    return source;
  };

  this.isLastTrack = function (index) {
    return index === _this2.sources.length - 1 && !player.loop && player.queuedTrack === null;
  };

  this.setCrossfade = function (crossfadeIn, crossfadeOut) {
    _this2.currentSource().setCrossfade(crossfadeIn, _this2.isLastTrack(_this2.trackNumber) ? 0 : crossfadeOut);
  };

  this.gotoTrack = function (pointOrPath, forcePlay, allowOverride, crossfadeEnabled) {
    var _this2$getSourceIndex2 = _this2.getSourceIndexed(_this2.trackNumber),
        prevIndex = _this2$getSourceIndex2.index,
        prevSource = _this2$getSourceIndex2.source; // TODO: why is this requrning false when queuedState was Play?


    var wasPlaying = prevSource.isPlayActive(true);

    var requestedIndex = _this2.indexFromTrack(pointOrPath);

    _this2.stopAllTracks(true, crossfadeEnabled ? [player.fadingTrack] : []);

    var updateShuffle = function updateShuffle(nextIndex) {
      if (_this2.shuffleRequest !== null) {
        if (_this2.shuffleRequest) {
          _this2.shuffleRequest = null;
          return enableShuffle(nextIndex);
        }

        _this2.shuffleRequest = null;
        return disableShuffle(nextIndex);
      }

      return nextIndex;
    };

    _this2.trackNumber = allowOverride ? updateShuffle(requestedIndex) : requestedIndex;
    log.debug("Setting track number to ".concat(_this2.trackNumber));

    _this2.updateLoading();

    player.scrub(0, true);

    var _this2$getSourceIndex3 = _this2.getSourceIndexed(_this2.trackNumber),
        nextIndex = _this2$getSourceIndex3.index,
        nextSource = _this2$getSourceIndex3.source;

    if (prevIndex === nextIndex) {
      if (forcePlay || wasPlaying && !player.isSingleLoop()) {
        prevSource.stop();
        prevSource.play();
      }

      return _this2.trackNumber;
    }

    if (!crossfadeEnabled) {
      prevSource.stop(true);
    }

    if (forcePlay || wasPlaying) {
      var crossfadeIn = crossfadeEnabled ? player.crossfade : 0;
      var crossfadeOut = crossfadeEnabled && !_this2.isLastTrack(nextIndex) ? player.crossfade : 0;
      nextSource.setCrossfade(crossfadeIn, crossfadeOut);
      nextSource.play();
    }

    return _this2.trackNumber;
  }; // Going into shuffle mode. Remake the list


  var enableShuffle = function enableShuffle(nextIndex) {
    // Shuffle the list
    var indices = Array.from(Array(_this2.sources.length).keys());

    for (var n = 0; n < indices.length - 1; n++) {
      var k = n + Math.floor(Math.random() * (indices.length - n));
      var _ref = [indices[n], indices[k]];
      indices[k] = _ref[0];
      indices[n] = _ref[1];
    }

    if (_this2.preserveCurrent && _this2.trackNumber === indices[nextIndex]) {
      // make sure our current shuffled index matches what is playing
      var _ref2 = [indices[nextIndex], indices[_this2.trackNumber]];
      indices[_this2.trackNumber] = _ref2[0];
      indices[nextIndex] = _ref2[1];
    } // if shuffle happens to be identical to original list (more likely with fewer tracks),
    // swap another two tracks


    if (JSON.stringify(indices) === JSON.stringify(Array.from(Array(_this2.sources.length).keys()))) {
      var subIndices = indices.filter(function (index) {
        return index !== _this2.trackNumber;
      });
      var subIndex1 = Math.floor(Math.random() * subIndices.length);
      var subIndex2 = (subIndex1 + 1) % subIndices.length;
      var index1 = indices[subIndices[subIndex1]];
      var index2 = indices[subIndices[subIndex2]];
      var _ref3 = [indices[index2], indices[index1]];
      indices[index1] = _ref3[0];
      indices[index2] = _ref3[1];
    }

    _this2.shuffledIndices = indices;
    _this2.shuffleMode = true;
    log.debug("Shuffled tracks: ".concat(_this2.shuffledIndices));
    return nextIndex;
  }; // Leaving shuffle mode.


  var disableShuffle = function disableShuffle(nextIndex) {
    _this2.shuffleMode = false;
    log.debug('Disabling shuffle');

    if (_this2.preserveCurrent && _this2.shuffledIndices[_this2.trackNumber] === nextIndex) {
      // avoid playing the same track twice, skip to next track
      return (nextIndex + 1) % _this2.numTracks();
    }

    return nextIndex;
  }; // PUBLIC METHODS
  // After a shuffle or unshuffle, the array has changed. Get the index
  // for the current-displayed song in the previous array.


  this.lastIndex = function (index, newList, oldList) {
    var compare = newList[index]; // Cannot compare full objects after clone() :(
    // Instead, compare the generated index

    for (var n = 0; n < oldList.length; n++) {
      if (oldList[n].index === compare.index) {
        return n;
      }
    } // Default value, in case some array value was removed


    return 0;
  };

  this.stopAllTracks = function (resetPositions) {
    var excludedTracks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    for (var i = 0; i < _this2.sources.length; i++) {
      if (!excludedTracks.includes(_this2.getPlaylistIndex(i))) {
        _this2.sources[i].stop(resetPositions);
      }
    }
  };

  this.removeAllTracks = function (flushList) {
    for (var i = 0; i < _this2.sources.length; i++) {
      _this2.sources[i].unload(); // also calls stop

    }

    if (flushList) {
      _this2.shuffledIndices = [];

      _this2.setStartingTrack(-1);
    }

    _this2.sources = [];
  };

  this.setPlaybackRate = function (rate) {
    for (var i = 0; i < _this2.sources.length; i++) {
      _this2.sources[i].setPlaybackRate(rate);
    }
  }; // Toggle shuffle mode or not, and prepare for rebasing the playlist
  // upon changing to the next available song. NOTE that each function here
  // changes flags, so the logic must exclude any logic if a revert occurs.


  this.setShuffle = function (nextShuffle) {
    var preserveCurrent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    _this2.shuffleRequest = nextShuffle;
    _this2.preserveCurrent = preserveCurrent;

    if (!preserveCurrent) {
      enableShuffle(_this2.trackNumber);
    }
  };

  this.isShuffled = function () {
    if (_this2.shuffleRequest !== null) {
      return _this2.shuffleRequest;
    }

    return _this2.shuffleMode;
  };

  this.numTracks = function () {
    return _this2.sources.length;
  }; // returns tracks in play order (if shuffled, the shuffled order will be reflected here)


  this.getTracks = function () {
    var tracks = [];

    for (var i = 0; i < _this2.numTracks(); i++) {
      var _this2$getSourceIndex4 = _this2.getSourceIndexed(i),
          source = _this2$getSourceIndex4.source;

      tracks.push(source.audioPath);
    }

    return tracks;
  }; // if path, returns index in play order


  this.indexFromTrack = function (pointOrPath) {
    return typeof pointOrPath === 'string' ? _this2.findTrack(pointOrPath) : pointOrPath;
  }; // returns index in play order


  this.findTrack = function (path) {
    return _this2.getTracks().indexOf(path);
  }; // returns source + index in play order


  this.getSourceIndexed = function (index) {
    var realIndex = _this2.shuffleMode ? _this2.shuffledIndices[index] : index;
    return {
      index: realIndex,
      source: _this2.sources[realIndex]
    };
  };

  this.getPlaylistIndex = function (index) {
    return _this2.shuffleMode ? _this2.shuffledIndices.indexOf(index) : index;
  }; // inclusive start, exclusive end


  var generateIntRange = function generateIntRange(first, last) {
    return Array.from({
      length: 1 + last - first
    }, function (_v, k) {
      return k + first;
    });
  }; // returns set of actual indices (not shuffled)


  this.loadableTracks = function () {
    if (_this2.loadLimit === -1) {
      return new Set(generateIntRange(0, _this2.sources.length));
    } // loadable tracks are a range where size=loadLimit, centered around current track


    var startTrack = Math.round(Math.max(0, _this2.trackNumber - (_this2.loadLimit - 1) / 2));
    var endTrack = Math.round(Math.min(_this2.sources.length, _this2.trackNumber + _this2.loadLimit / 2));
    var loadableIndices = new Set(generateIntRange(startTrack, endTrack));

    if (player.queuedTrack !== null) {
      loadableIndices.add(_this2.indexFromTrack(player.queuedTrack));
    }

    if (player.fadingTrack !== null) {
      loadableIndices.add(_this2.indexFromTrack(player.fadingTrack));
    }

    log.debug("Loadable indices: ".concat(JSON.stringify(_toConsumableArray(loadableIndices))));
    return loadableIndices;
  };

  this.updateLoading = function () {
    var loadableSet = _this2.loadableTracks();

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _this2.sources.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2),
            index = _step$value[0],
            source = _step$value[1];

        var playlistIndex = _this2.getPlaylistIndex(index);

        var shouldLoad = loadableSet.has(playlistIndex);

        if (shouldLoad === (source.getState() === Gapless5State.None)) {
          if (shouldLoad) {
            log.debug("Loading track ".concat(playlistIndex, ": ").concat(source.audioPath));
            source.load();
          } else {
            source.unload();
            log.debug("Unloaded track ".concat(playlistIndex, ": ").concat(source.audioPath));
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }; // Add a new song into the FileList object.


  this.add = function (index, audioPath) {
    var source = new Gapless5Source(player, log, audioPath);

    _this2.sources.splice(index, 0, source); // insert new index in random position


    _this2.shuffledIndices.splice(Math.floor(Math.random() * _this2.numTracks()), 0, _this2.numTracks() - 1); // Shift trackNumber if the insert file is earlier in the list


    if (index <= _this2.trackNumber || _this2.trackNumber === -1) {
      _this2.trackNumber = _this2.trackNumber + 1;

      if (_this2.trackNumber > 0) {
        log.debug("Insertion shifted current track number to ".concat(_this2.trackNumber));
      }
    }

    _this2.updateLoading();
  }; // Remove a song from the FileList object.


  this.remove = function (index) {
    _this2.sources.splice(index, 1);

    _this2.shuffledIndices.splice(_this2.shuffledIndices.indexOf(index), 1);

    for (var i = 0; i < _this2.shuffledIndices.length; i++) {
      if (_this2.shuffledIndices[i] >= index) {
        _this2.shuffledIndices[i] = _this2.shuffledIndices[i] - 1;
      }
    } // Stay at the same song index, unless trackNumber is after the
    // removed index, or was removed at the edge of the list


    if (_this2.trackNumber > 0 && (index < _this2.trackNumber || index >= _this2.numTracks() - 2)) {
      _this2.trackNumber = _this2.trackNumber - 1;
      log.debug("Decrementing track number to ".concat(_this2.trackNumber));
    }

    if (_this2.isShuffled && !player.canShuffle()) {
      _this2.setShuffle(false);

      player.uiDirty = true;
    }

    _this2.updateLoading();
  }; // process inputs from constructor


  if (inTracks.length > 0) {
    for (var i = 0; i < inTracks.length; i++) {
      this.sources.push(new Gapless5Source(player, log, inTracks[i]));
      this.shuffledIndices.splice(Math.floor(Math.random() * this.numTracks()), 0, this.numTracks() - 1);
    }

    this.setStartingTrack(inStartingTrack);
    this.updateLoading();
  }
} // parameters are optional.
//   options:
//     guiId: id of existing HTML element where UI should be rendered
//     tracks: path of file (or array of music file paths)
//     useWebAudio (default = true)
//     useHTML5Audio (default = true)
//     startingTrack (number or "random", default = 0)
//     loadLimit (max number of tracks loaded at one time, default = -1, no limit)
//     logLevel (default = LogLevel.Info) minimum logging level
//     shuffle (true or false): start the jukebox in shuffle mode
//     shuffleButton (default = true): whether shuffle button appears or not in UI
//     loop (default = false): whether to return to first track after end of playlist
//     singleMode (default = false): whether to treat single track as playlist
//     playbackRate (default = 1.0): higher number = faster playback
//     exclusive (default = false): whether to stop other gapless players when this is playing


function Gapless5() {
  var _this3 = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var deprecated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // eslint-disable-line no-unused-vars
  // Backwards-compatibility with deprecated API
  if (typeof options === 'string') {
    console.warn('Using deprecated API.  Pass element id into options as "guiId"');
    options = _objectSpread({}, deprecated, {
      guiId: options
    });
  } // UI


  var scrubSize = 65535;
  var statusUI = {
    loading: "loading\u2026",
    error: 'error!',
    percent: 0
  };
  this.hasGUI = false;
  this.scrubWidth = 0;
  this.scrubPosition = 0;
  this.isScrubbing = false; // System

  var tickCallback = null;
  this.tickMS = 27; // fast enough for numbers to look real-time

  this.initialized = false;
  this.uiDirty = true;
  var log = {
    debug: function debug() {},
    log: function log() {},
    warn: function warn() {},
    error: function error() {}
  };

  switch (options.logLevel || LogLevel.Info) {
    /* eslint-disable no-fallthrough */
    case LogLevel.Debug:
      log.debug = console.debug;

    case LogLevel.Info:
      log.info = console.info;

    case LogLevel.Warning:
      log.warn = console.warn;

    case LogLevel.Error:
      log.error = console.error;

    case LogLevel.None:
    default:
      break;

    /* eslint-enable no-fallthrough */
  }

  this.playlist = null;
  this.loop = options.loop || false;
  this.singleMode = options.singleMode || false;
  this.exclusive = options.exclusive || false;
  this.queuedTrack = null;
  this.fadingTrack = null;
  this.volume = options.volume !== undefined ? options.volume : 1.0;
  this.crossfade = options.crossfade || 0;
  this.crossfadeShape = options.crossfadeShape || CrossfadeShape.None; // This is a hack to activate WebAudio on certain iOS versions

  var silenceWavData = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  var playAllowed = false; // true after user initiates action

  var stubAudio = new Audio();
  stubAudio.controls = false;
  stubAudio.loop = true;
  stubAudio.src = silenceWavData;
  stubAudio.load();

  this.onPlayAllowed = function () {
    if (!playAllowed) {
      playAllowed = true;
      stubAudio.play().then(function () {
        stubAudio.pause();
      });
    }
  }; // these default to true if not defined


  this.useWebAudio = options.useWebAudio !== false;
  this.useHTML5Audio = options.useHTML5Audio !== false;
  this.playbackRate = options.playbackRate || 1.0;
  this.id = options.guiId || Math.floor((1 + Math.random()) * 0x10000);
  gapless5Players[this.id] = this; // There can be only one AudioContext per window, so to have multiple players we must define this outside the player scope

  if (window.gapless5AudioContext === undefined) {
    var MaybeContext = window.AudioContext || window.webkitAudioContext;

    if (MaybeContext) {
      window.gapless5AudioContext = new MaybeContext();
    }
  }

  this.context = window.gapless5AudioContext; // Callback and Execution logic

  this.keyMappings = {}; // Callbacks

  this.onprev = function () {};

  this.onplayrequest = function () {}; // play requested by user


  this.onplay = function () {}; // play actually starts


  this.onpause = function () {};

  this.onstop = function () {};

  this.onnext = function () {};

  this.onerror = function () {};

  this.onloadstart = function () {}; // load started


  this.onload = function () {}; // load completed


  this.onunload = function () {};

  this.onfinishedtrack = function () {};

  this.onfinishedall = function () {};

  this.ontimeupdate = function () {}; // INTERNAL HELPERS


  var getUIPos = function getUIPos() {
    if (!_this3.currentSource() || !_this3.currentLength()) {
      return 0;
    }

    var isScrubbing = _this3.isScrubbing,
        scrubPosition = _this3.scrubPosition;
    var position = isScrubbing ? scrubPosition : _this3.currentPosition();
    return position / _this3.currentLength() * scrubSize;
  };

  var getSoundPos = function getSoundPos(uiPosition) {
    return uiPosition / scrubSize * _this3.currentLength();
  }; // Current index (if sourceIndex = true and shuffle is on, value will be different)


  this.getIndex = function () {
    var sourceIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    // FileList object must be initiated
    if (_this3.playlist !== null) {
      var trackNumber = _this3.playlist.trackNumber;
      return sourceIndex ? _this3.playlist.getSourceIndexed(trackNumber).index : trackNumber;
    }

    return -1;
  };

  var getFormattedTime = function getFormattedTime(inMS) {
    var minutes = Math.floor(inMS / 60000);
    var secondsFull = (inMS - minutes * 60000) / 1000;
    var seconds = Math.floor(secondsFull);
    var csec = Math.floor((secondsFull - seconds) * 100);

    if (minutes < 10) {
      minutes = "0".concat(minutes);
    }

    if (seconds < 10) {
      seconds = "0".concat(seconds);
    }

    if (csec < 10) {
      csec = "0".concat(csec);
    }

    return "".concat(minutes, ":").concat(seconds, ".").concat(csec);
  };

  var getTotalPositionText = function getTotalPositionText() {
    var text = statusUI.loading;

    if (_this3.totalTracks() === 0) {
      return text;
    }

    var srcLength = _this3.currentLength();

    if (_this3.currentSource() && _this3.currentSource().state === Gapless5State.Error) {
      text = statusUI.error;
    } else if (srcLength > 0) {
      text = getFormattedTime(srcLength);
    }

    return text;
  };

  var getTrackName = function getTrackName() {
    var source = _this3.currentSource();

    return source ? source.trackName : '';
  };

  var getElement = function getElement(prefix) {
    return document.getElementById("g5".concat(prefix, "-").concat(_this3.id));
  };

  var setElementText = function setElementText(prefix, text) {
    var element = getElement(prefix);

    if (element) {
      element.innerText = text;
    }
  };

  var isValidIndex = function isValidIndex(index) {
    return index >= 0 && index < _this3.playlist.numTracks();
  }; // (PUBLIC) ACTIONS


  this.totalTracks = function () {
    // FileList object must be initiated
    if (_this3.playlist !== null) {
      return _this3.playlist.numTracks();
    }

    return 0;
  };

  this.isSingleLoop = function () {
    return _this3.loop && (_this3.singleMode || _this3.totalTracks() === 1);
  };

  this.mapKeys = function (keyOptions) {
    for (var key in keyOptions) {
      var uppercode = keyOptions[key].toUpperCase().charCodeAt(0);
      var lowercode = keyOptions[key].toLowerCase().charCodeAt(0);
      var player = gapless5Players[_this3.id];

      if (Gapless5.prototype.hasOwnProperty.call(player, key)) {
        _this3.keyMappings[uppercode] = player[key];
        _this3.keyMappings[lowercode] = player[key];
      } else {
        log.error("Gapless5 mapKeys() error: no function named '".concat(key, "'"));
      }
    }

    document.addEventListener('keydown', function (e) {
      var keyCode = e.key.charCodeAt(0);

      if (keyCode in _this3.keyMappings) {
        _this3.keyMappings[keyCode](e);
      }
    });
  };

  this.getPosition = function () {
    if (_this3.currentSource()) {
      return _this3.currentSource().getPosition();
    }

    return 0;
  };

  this.setPosition = function (position) {
    if (_this3.currentSource()) {
      _this3.currentSource().setPosition(position, true);
    }
  }; // volume is normalized between 0 and 1


  this.setVolume = function (volume) {
    _this3.volume = volume;

    if (_this3.hasGUI) {
      getElement('volume').value = scrubSize * volume;
    }
  };

  this.setGain = function (uiPos) {
    log.warn('Using deprecated API.  Use setVolume() with value between 0 and 1 instead.');

    _this3.setVolume(uiPos / scrubSize);
  };

  this.scrub = function (uiPos) {
    var updateTransport = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (_this3.hasGUI) {
      _this3.scrubPosition = getSoundPos(uiPos);
      setElementText('position', getFormattedTime(_this3.scrubPosition));
      enableButton('prev', _this3.loop || _this3.getIndex() !== 0 || _this3.scrubPosition !== 0);

      if (updateTransport) {
        getElement('transportbar').value = uiPos;
      }

      if (!_this3.isScrubbing && _this3.currentSource()) {
        _this3.currentSource().setPosition(_this3.scrubPosition);
      }
    }
  };

  this.setLoadedSpan = function (percent) {
    if (_this3.hasGUI && statusUI.percent !== percent) {
      statusUI.percent = percent;
      getElement('loadedspan').style.width = percent * _this3.scrubWidth;

      if (percent === 1) {
        setElementText('duration', getTotalPositionText());
      }
    }
  };

  this.onEndedCallback = function () {
    // we've finished playing the track
    var finishedAll = false;

    var source = _this3.currentSource();

    if (source) {
      var audioPath = source.audioPath;

      if (_this3.queuedTrack !== null) {
        _this3.gotoTrack(_this3.queuedTrack);

        _this3.queuedTrack = null;
      } else if (_this3.loop || _this3.getIndex() < _this3.totalTracks() - 1) {
        if (_this3.singleMode || _this3.totalTracks() === 1) {
          if (_this3.loop) {
            _this3.prev(null, false);
          }
        } else {
          var tryStopFadingTrack = function tryStopFadingTrack() {
            var fadingSource = getFadingSource();

            if (fadingSource) {
              fadingSource.stop(true);
            }

            _this3.fadingTrack = null;
          };

          _this3.fadingTrack = _this3.getIndex();
          window.setTimeout(function () {
            tryStopFadingTrack();
          }, _this3.crossfade);

          _this3.next(null, true, true);
        }
      } else {
        source.stop(true);

        _this3.scrub(0, true);

        finishedAll = true;
      }

      _this3.onfinishedtrack(audioPath);
    }

    if (finishedAll) {
      _this3.onfinishedall();
    }
  };

  this.onStartedScrubbing = function () {
    _this3.isScrubbing = true;
  };

  this.onFinishedScrubbing = function () {
    _this3.isScrubbing = false;

    var source = _this3.currentSource();

    if (source) {
      if (source.inPlayState() && _this3.scrubPosition >= _this3.currentLength()) {
        _this3.next(null, true);
      } else {
        source.setPosition(_this3.scrubPosition, true);
      }
    }
  };

  this.addTrack = function (audioPath) {
    var nextTrack = _this3.playlist.numTracks();

    _this3.playlist.add(nextTrack, audioPath);

    _this3.uiDirty = true;
  };

  this.insertTrack = function (point, audioPath) {
    var numTracks = _this3.totalTracks();

    var safePoint = Math.min(Math.max(point, 0), numTracks);

    if (safePoint === numTracks) {
      _this3.addTrack(audioPath);
    } else {
      _this3.playlist.add(safePoint, audioPath);
    }

    _this3.uiDirty = true;
  };

  this.getTracks = function () {
    return _this3.playlist.getTracks();
  };

  this.findTrack = function (path) {
    return _this3.playlist.findTrack(path);
  };

  this.removeTrack = function (pointOrPath) {
    var point = _this3.playlist.indexFromTrack(pointOrPath);

    if (!isValidIndex(point)) {
      log.warn("Cannot remove missing track: ".concat(pointOrPath));
      return;
    }

    var deletedPlaying = point === _this3.playlist.trackNumber;

    var _this3$playlist$getSo = _this3.playlist.getSourceIndexed(point),
        curSource = _this3$playlist$getSo.source;

    if (!curSource) {
      return;
    }

    var wasPlaying = false;

    if (curSource.state === Gapless5State.Loading) {
      curSource.unload();
    } else if (curSource.inPlayState(true)) {
      wasPlaying = true;
      curSource.stop();
    }

    _this3.playlist.remove(point);

    if (deletedPlaying) {
      _this3.next(); // Don't stop after a delete


      if (wasPlaying) {
        _this3.play();
      }
    }

    _this3.uiDirty = true;
  };

  this.replaceTrack = function (point, audioPath) {
    _this3.removeTrack(point);

    _this3.insertTrack(point, audioPath);
  };

  this.removeAllTracks = function () {
    var flushPlaylist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    _this3.playlist.removeAllTracks(flushPlaylist);

    _this3.uiDirty = true;
  };

  this.isShuffled = function () {
    return _this3.playlist.isShuffled();
  }; // shuffles, re-shuffling if previously shuffled


  this.shuffle = function () {
    var preserveCurrent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    if (!_this3.canShuffle()) {
      return;
    }

    _this3.playlist.setShuffle(true, preserveCurrent);

    _this3.uiDirty = true;
  }; // toggles between shuffled and unshuffled


  this.toggleShuffle = function () {
    if (_this3.canShuffle()) {
      _this3.playlist.setShuffle(!_this3.isShuffled());

      _this3.uiDirty = true;
    }
  }; // backwards-compatibility with previous function name


  this.shuffleToggle = this.toggleShuffle;

  this.currentSource = function () {
    return _this3.playlist ? _this3.playlist.currentSource() : null;
  };

  this.currentLength = function () {
    return _this3.currentSource() ? _this3.currentSource().getLength() : 0;
  };

  this.currentPosition = function () {
    return _this3.currentSource() ? _this3.currentSource().getPosition() : 0;
  };

  this.setPlaybackRate = function (rate) {
    tick(); // tick once here before changing the playback rate, to maintain correct position

    _this3.playbackRate = rate;

    _this3.playlist.setPlaybackRate(rate);
  };

  this.setCrossfade = function (duration) {
    _this3.crossfade = duration;

    if (_this3.isPlaying()) {
      var totalCrossfade = _this3.crossfade;

      _this3.playlist.setCrossfade(totalCrossfade, totalCrossfade);
    }
  };

  this.setCrossfadeShape = function (shape) {
    _this3.crossfadeShape = shape;
  };

  this.queueTrack = function (pointOrPath) {
    if (!isValidIndex(_this3.playlist.indexFromTrack(pointOrPath))) {
      log.error("Cannot queue missing track: ".concat(pointOrPath));
    } else {
      _this3.queuedTrack = pointOrPath;

      _this3.playlist.updateLoading();
    }
  };

  this.gotoTrack = function (pointOrPath, forcePlay) {
    var allowOverride = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var crossfadeEnabled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    if (!isValidIndex(_this3.playlist.indexFromTrack(pointOrPath))) {
      log.error("Cannot go to missing track: ".concat(pointOrPath));
    } else {
      var newIndex = _this3.playlist.gotoTrack(pointOrPath, forcePlay, allowOverride, crossfadeEnabled);

      enableButton('prev', _this3.loop || !_this3.singleMode && newIndex > 0);
      enableButton('next', _this3.loop || !_this3.singleMode && newIndex < _this3.totalTracks() - 1);
      _this3.uiDirty = true;
    }
  };

  this.prevtrack = function () {
    var currentSource = _this3.currentSource();

    if (!currentSource) {
      return;
    }

    var track = 0;

    if (_this3.getIndex() > 0) {
      track = _this3.getIndex() - 1;
    } else if (_this3.loop) {
      track = _this3.totalTracks() - 1;
    } else {
      return;
    }

    _this3.gotoTrack(track);

    var newSource = _this3.currentSource();

    _this3.onprev(currentSource.audioPath, newSource.audioPath);
  };

  this.prev = function (uiEvent, forceReset) {
    var currentSource = _this3.currentSource();

    if (!currentSource) {
      return;
    }

    var wantsCallback = true;
    var track = 0;

    var playlistIndex = _this3.getIndex();

    var position = currentSource.getPosition();

    if (position > 0) {
      // jump to start of track if we're not there
      _this3.scrub(0, true);

      currentSource.setPosition(0, forceReset || Boolean(uiEvent));

      _this3.playlist.setCrossfade(0, _this3.crossfade);

      track = playlistIndex;
      wantsCallback = false;
    } else if (_this3.singleMode && _this3.loop) {
      track = playlistIndex;
    } else if (playlistIndex > 0) {
      track = playlistIndex - 1;
    } else if (_this3.loop) {
      track = _this3.totalTracks() - 1;
    } else {
      return;
    }

    if (wantsCallback) {
      _this3.gotoTrack(track, forceReset, true);

      var newSource = _this3.currentSource();

      _this3.onprev(currentSource.audioPath, newSource.audioPath);
    }
  };

  this.next = function (_uiEvent, forcePlay, crossfadeEnabled) {
    var currentSource = _this3.currentSource();

    if (!currentSource) {
      return;
    }

    var track = 0;

    var playlistIndex = _this3.getIndex();

    if (_this3.singleMode) {
      track = playlistIndex;
    } else if (playlistIndex < _this3.totalTracks() - 1) {
      track = playlistIndex + 1;
    } else if (!_this3.loop) {
      return;
    }

    _this3.gotoTrack(track, forcePlay, true, crossfadeEnabled);

    var newSource = _this3.currentSource();

    _this3.onnext(currentSource.audioPath, newSource.audioPath);
  };

  this.play = function () {
    var source = _this3.currentSource();

    if (!source) {
      return;
    }

    _this3.playlist.setCrossfade(0, _this3.crossfade);

    source.play();

    if (_this3.exclusive) {
      var id = _this3.id;

      for (var otherId in gapless5Players) {
        if (otherId !== id.toString()) {
          gapless5Players[otherId].stop();
        }
      }
    }

    _this3.onplayrequest(source.audioPath);
  };

  this.playpause = function () {
    var source = _this3.currentSource();

    if (source && source.inPlayState(true)) {
      _this3.pause();
    } else {
      _this3.play();
    }
  };

  this.cue = function () {
    if (_this3.currentPosition() > 0) {
      _this3.prev(null, true);
    }

    _this3.play();
  };

  this.pause = function () {
    var source = _this3.currentSource();

    _this3.playlist.stopAllTracks();

    if (source) {
      _this3.onpause(source.audioPath);
    }
  };

  this.stop = function () {
    var source = _this3.currentSource();

    var lastPosition = source ? source.getPosition() : 0;

    _this3.playlist.stopAllTracks(true);

    if (source) {
      if (lastPosition > 0) {
        _this3.scrub(0, true);
      }

      _this3.onstop(source.audioPath);
    }
  }; // (PUBLIC) QUERIES AND CALLBACKS


  this.isPlaying = function () {
    return _this3.currentSource() && _this3.currentSource().inPlayState();
  }; // INIT AND UI


  var enableButton = function enableButton(buttonId, bEnable) {
    if (_this3.hasGUI) {
      var elem = getElement(buttonId);

      if (elem) {
        var classList = elem.classList;
        classList.remove(bEnable ? 'disabled' : 'enabled');
        classList.add(bEnable ? 'enabled' : 'disabled');
      }
    }
  };

  var enableShuffleButton = function enableShuffleButton(mode, bEnable) {
    var elem = getElement('shuffle');

    if (elem) {
      var isShuffle = mode === 'shuffle';
      elem.classList.remove(isShuffle ? 'g5unshuffle' : 'g5shuffle');
      elem.classList.add(isShuffle ? 'g5shuffle' : 'g5unshuffle');
      enableButton('shuffle', bEnable);
    }
  }; // Must have at least 3 tracks in order for shuffle button to work
  // If so, permanently turn on the shuffle toggle


  this.canShuffle = function () {
    return _this3.totalTracks() > 2;
  };

  var updateDisplay = function updateDisplay() {
    if (!_this3.hasGUI) {
      return;
    }

    var numTracks = _this3.totalTracks();

    if (numTracks === 0) {
      setElementText('index', '0');
      setElementText('numtracks', '0');
      setElementText('trackname', '');
      setElementText('position', getFormattedTime(0));
      setElementText('duration', getFormattedTime(0));
      enableButton('prev', false);
      enableShuffleButton('shuffle', false);
      enableButton('next', false);
    } else {
      setElementText('index', _this3.playlist.trackNumber + 1);
      setElementText('numtracks', numTracks);
      setElementText('trackname', getTrackName());
      setElementText('duration', getTotalPositionText());
      enableButton('prev', _this3.loop || _this3.getIndex() > 0 || _this3.currentPosition() > 0);
      enableButton('next', _this3.loop || _this3.getIndex() < numTracks - 1);

      var source = _this3.currentSource();

      if (source && source.inPlayState(true)) {
        enableButton('play', false);
      } else {
        enableButton('play', true);

        if (source && source.state === Gapless5State.Error) {
          _this3.onerror(source.audioPath);
        }
      }

      enableShuffleButton(_this3.isShuffled() ? 'unshuffle' : 'shuffle', _this3.canShuffle());
    }
  };

  var getFadingSource = function getFadingSource() {
    if (_this3.fadingTrack !== null) {
      var _this3$playlist$getSo2 = _this3.playlist.getSourceIndexed(_this3.fadingTrack),
          fadingSource = _this3$playlist$getSo2.source;

      return fadingSource;
    }

    return null;
  };

  var tick = function tick() {
    var fadingSource = getFadingSource();

    if (fadingSource) {
      fadingSource.tick(false);
    }

    var source = _this3.currentSource();

    if (source) {
      var loadedSpan = source.tick(true);

      _this3.setLoadedSpan(loadedSpan);

      if (_this3.uiDirty) {
        _this3.uiDirty = false;
        updateDisplay();
      }

      if (source.inPlayState()) {
        var soundPos = source.getPosition();

        if (_this3.isScrubbing) {
          // playing track, update bar position
          soundPos = _this3.scrubPosition;
        }

        if (_this3.hasGUI) {
          getElement('transportbar').value = getUIPos();
          setElementText('position', getFormattedTime(soundPos));
        }

        _this3.ontimeupdate(); // Mukyu

      }
    }

    if (tickCallback) {
      window.clearTimeout(tickCallback);
    }

    tickCallback = window.setTimeout(tick, _this3.tickMS);
  };

  var createGUI = function createGUI(playerHandle) {
    var id = _this3.id;

    var elemId = function elemId(name) {
      return "g5".concat(name, "-").concat(id);
    };

    var playerWrapper = function playerWrapper(html) {
      return "\n    <div class=\"g5positionbar\" id=\"".concat(elemId('positionbar'), "\">\n      <span id=\"").concat(elemId('position'), "\">").concat(getFormattedTime(0), "</span> |\n      <span id=\"").concat(elemId('duration'), "\">").concat(statusUI.loading, "</span> |\n      <span id=\"").concat(elemId('index'), "\">1</span>/<span id=\"").concat(elemId('numtracks'), "\">1</span>\n    </div>\n    <div class=\"g5inside\" id=\"").concat(elemId('inside'), "\">\n      ").concat(html, "\n    </div>\n  ");
    };

    if (typeof Audio === 'undefined') {
      _this3.hasGUI = false;
      return playerWrapper('This player is not supported by your browser.');
    }

    return playerWrapper("\n    <div class=\"g5transport\">\n      <div class=\"g5meter\" id=\"".concat(elemId('meter'), "\"><span id=\"").concat(elemId('loadedspan'), "\" style=\"width: 0%\"></span></div>\n      <input type=\"range\" class=\"transportbar\" name=\"transportbar\" id=\"").concat(elemId('transportbar'), "\"\n        min=\"0\" max=\"").concat(scrubSize, "\" value=\"0\" oninput=\"").concat(playerHandle, ".scrub(this.value);\"\n        onmousedown=\"").concat(playerHandle, ".onStartedScrubbing();\" ontouchstart=\"").concat(playerHandle, ".onStartedScrubbing();\"\n        onmouseup=\"").concat(playerHandle, ".onFinishedScrubbing();\" ontouchend=\"").concat(playerHandle, ".onFinishedScrubbing();\"\n      />\n    </div>\n    <div class=\"g5buttons\" id=\"").concat(elemId('buttons'), "\">\n      <button class=\"g5button g5prev\" id=\"").concat(elemId('prev'), "\"></button>\n      <button class=\"g5button g5play\" id=\"").concat(elemId('play'), "\"></button>\n      <button class=\"g5button g5stop\" id=\"").concat(elemId('stop'), "\"></button>\n      <button class=\"g5button g5shuffle\" id=\"").concat(elemId('shuffle'), "\"></button>\n      <button class=\"g5button g5next\" id=\"").concat(elemId('next'), "\"></button>\n      <input type=\"range\" id=\"").concat(elemId('volume'), "\" class=\"volume\" name=\"gain\" min=\"0\" max=\"").concat(scrubSize, "\"\n        value=\"").concat(scrubSize, "\" oninput=\"").concat(playerHandle, ".setVolume(this.value / ").concat(scrubSize, ");\"\n      />\n    </div>\n  "));
  };

  var guiElement = options.guiId ? document.getElementById(options.guiId) : null;

  if (guiElement) {
    this.hasGUI = true;
    guiElement.insertAdjacentHTML('beforeend', createGUI("gapless5Players['".concat(this.id, "']")));

    var onMouseDown = function onMouseDown(elementId, cb) {
      var elem = getElement(elementId);

      if (elem) {
        elem.addEventListener('mousedown', cb);
      }
    }; // set up button mappings


    onMouseDown('prev', this.prev);
    onMouseDown('play', this.playpause);
    onMouseDown('stop', this.stop);
    onMouseDown('shuffle', this.toggleShuffle);
    onMouseDown('next', this.next);
    enableButton('play', true);
    enableButton('stop', true);
    setElementText('position', getFormattedTime(0)); // set up whether shuffleButton appears or not (default is visible)

    if (options.shuffleButton === false) {
      // Style items per earlier Gapless versions
      var setElementWidth = function setElementWidth(elementId, width) {
        var elem = getElement(elementId);

        if (elem) {
          elem.style.width = width;
        }
      };

      var transSize = '111px';
      var playSize = '115px';
      setElementWidth('transportbar', transSize);
      setElementWidth('meter', transSize);
      setElementWidth('positionbar', playSize);
      setElementWidth('inside', playSize);
      getElement('shuffle').remove();
    }

    this.scrubWidth = getElement('transportbar').style.width;
  }

  if (typeof Audio === 'undefined') {
    log.error('This player is not supported by your browser.');
    return;
  } // set up starting track number


  if ('startingTrack' in options) {
    if (typeof options.startingTrack === 'number') {
      this.startingTrack = options.startingTrack;
    } else if (typeof options.startingTrack === 'string' && options.startingTrack === 'random') {
      this.startingTrack = 'random';
    }
  } // set up key mappings


  if ('mapKeys' in options) {
    this.mapKeys(options.mapKeys);
  } // set up tracks into a FileList object


  if ('tracks' in options) {
    var items = [];
    var startingTrack = 0;

    if (Array.isArray(options.tracks)) {
      if (typeof options.tracks[0] === 'string') {
        items = options.tracks;

        for (var i = 0; i < options.tracks.length; i++) {
          items[i] = options.tracks[i];
        }

        startingTrack = this.startingTrack || 0;
      } else if (_typeof(options.tracks[0]) === 'object') {
        // convert JSON items into array
        for (var _i2 = 0; _i2 < options.tracks.length; _i2++) {
          items[_i2] = options.tracks[_i2].file;
        }

        startingTrack = this.startingTrack || 0;
      }
    } else if (typeof options.tracks === 'string') {
      items[0] = options.tracks;
    }

    this.playlist = new Gapless5FileList(this, log, options.shuffle, options.loadLimit, items, startingTrack);
  } else {
    this.playlist = new Gapless5FileList(this, log, options.shuffle, options.loadLimit);
  }

  this.initialized = true;
  this.uiDirty = true;
  tick();
}