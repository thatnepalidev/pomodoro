let timeLeft = 25 * 60;
let timerId = null;
let isBreakSession = false;
let player = null;
let alarmPlayer = null;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const breakBtn = document.getElementById('breakBtn');

const WORK_TIME = 25 * 60;  // 25 minutes
const BREAK_TIME = 5 * 60;   // 5 minutes
const playBtn = document.getElementById('playBtn');
const songSelect = document.getElementById('songSelect');
const progressSlider = document.getElementById('progressSlider');


const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popup-message');
const popupOk = document.getElementById('popup-ok');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Core timer logic - handles countdown and state changes
function startTimer() {
    if (timerId === null) {
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft === 0) {
                clearInterval(timerId);
                timerId = null;
                startBtn.textContent = 'Start';
                startBtn.classList.remove('pause');
                showPopup(isBreakSession ? 'Break is over' : 'Take a break now');
                playAlarm();
            }
        }, 1000);
        startBtn.textContent = 'Pause';
        startBtn.classList.add('pause');
    } else {
        clearInterval(timerId);
        timerId = null;
        startBtn.textContent = 'Continue';
        startBtn.classList.remove('pause');
    }
}

function startBreak() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = BREAK_TIME;
    updateDisplay();
    startBtn.textContent = 'Start';
    startBtn.classList.remove('pause');
    isBreakSession = true;
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = WORK_TIME;
    updateDisplay();
    startBtn.textContent = 'Start';
    startBtn.classList.remove('pause');
    isBreakSession = false;
}

// Add or modify music options here
function loadMusicOptions() {
    const musicOptions = [
        { name: "Classical I", videoId: "ci7AqbLpm4M" },
        { name: "Classical II", videoId: "3ZltabzNSDs" },
        { name: "Classical III", videoId: "bis3S_CeE04" },
        { name: "White Noise", videoId: "nMfPqeZjc2c" },
        { name: "Ancient Greece", videoId: "tAKAkhwEf0M" }
    ];

    const placeholder = document.createElement('option');
    placeholder.value = "";
    placeholder.textContent = "Select a song";
    placeholder.disabled = true;
    placeholder.selected = true;
    songSelect.appendChild(placeholder);

    musicOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.videoId;
        optionElement.textContent = option.name;
        songSelect.appendChild(optionElement);
    });
}

function togglePlay() {
    if (!songSelect.value) return;

    if (!player) {
        initializePlayer(songSelect.value);
    } else {
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            playBtn.classList.remove('playing');
        } else {
            player.playVideo();
            playBtn.classList.add('playing');
        }
    }
}

function initializePlayer(videoId) {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'loop': 1,
            'playlist': videoId,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        playBtn.classList.add('playing');
        updateProgressBar();
    } else if (event.data === YT.PlayerState.PAUSED) {
        playBtn.classList.remove('playing');
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
    updateProgressBar();
}

function updateProgressBar() {
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        progressSlider.max = duration;
        if (!progressSlider.dragging) {
            progressSlider.value = currentTime;
        }
        requestAnimationFrame(updateProgressBar);
    }
}

// Change alarm sound by updating this videoId
function playAlarm() {
    if (!alarmPlayer) {
        alarmPlayer = new YT.Player('alarm-player', {
            height: '0',
            width: '0',
            videoId: 'kcT-i9xzC-8',  // YouTube video ID for alarm sound
            playerVars: {
                'autoplay': 1,
                'controls': 0
            },
            events: {
                'onError': (event) => console.error('Alarm Player Error:', event.data)
            }
        });
    } else {
        alarmPlayer.playVideo();
    }
}

function showPopup(message) {
    popupMessage.textContent = message;
    popup.style.display = 'flex';
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        player.wasPlaying = true;
    }
}

function hidePopup() {
    popup.style.display = 'none';
    if (alarmPlayer) {
        alarmPlayer.stopVideo();
    }
    if (player && player.wasPlaying) {
        player.playVideo();
        player.wasPlaying = false;
    }
    
    if (popupMessage.textContent === 'Take a break now') {
        startBreak();
        startTimer();
    } else {
        timeLeft = WORK_TIME;
        updateDisplay();
        timerId = null;
        startBtn.textContent = 'Start';
        startBtn.classList.remove('pause');
        isBreakSession = false;
    }
}

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
breakBtn.addEventListener('click', startBreak);
playBtn.addEventListener('click', togglePlay);
popupOk.addEventListener('click', hidePopup);

songSelect.addEventListener('change', () => {
    if (player) {
        player.destroy();
        player = null;
    }
    playBtn.classList.remove('playing');
    progressSlider.value = 0;
    
    if (songSelect.value) {
        initializePlayer(songSelect.value);
    }
});

progressSlider.addEventListener('mousedown', () => {
    progressSlider.dragging = true;
});

progressSlider.addEventListener('mouseup', () => {
    progressSlider.dragging = false;
});

progressSlider.addEventListener('input', () => {
    if (player && player.seekTo) {
        const time = parseFloat(progressSlider.value);
        player.seekTo(time, true);
    }
});

loadMusicOptions();
