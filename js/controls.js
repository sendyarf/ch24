let playPauseBtn = null;
let playIcon = null;
let liveIndicator = null;
let delayIndicator = null;
let fullscreenBtn = null;
let fullscreenIcon = null;
let videoContainer = null;
let delaySeconds = null;
let isLive = true;
let delayAmount = 0;
let controlsTimeout = null;

function setupCustomControls() {
    playPauseBtn = document.getElementById('playPauseBtn');
    playIcon = document.getElementById('playIcon');
    liveIndicator = document.getElementById('liveIndicator');
    delayIndicator = document.getElementById('delayIndicator');
    fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenIcon = document.getElementById('fullscreenIcon');
    videoContainer = document.getElementById('videoContainer');
    delaySeconds = document.getElementById('delaySeconds');

    playPauseBtn.addEventListener('click', togglePlayPause);
    fullscreenBtn.addEventListener('click', toggleFullScreen);
    video.addEventListener('play', updatePlayPauseButton);
    video.addEventListener('pause', updatePlayPauseButton);

    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);

    const controls = document.querySelector('.video-controls');
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    function showControls() {
        clearTimeout(controlsTimeout);
        controls.classList.add('visible');
        controlsTimeout = setTimeout(hideControls, 3000);
    }

    function hideControls() {
        controls.classList.remove('visible');
        document.getElementById('qualityMenu').classList.remove('visible');
    }

    videoContainer.addEventListener('mousemove', showControls);
    videoContainer.addEventListener('touchstart', (e) => {
        if (e.target === video) {
            e.preventDefault();
            showControls();
        }
    });

    video.addEventListener('click', (e) => {
        if (!controls.contains(e.target)) {
            togglePlayPause();
            showControls();
        }
    });

    video.addEventListener('play', showControls);

    controls.addEventListener('mousemove', (e) => {
        e.stopPropagation();
        showControls();
    });
    controls.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        showControls();
    });

    startStreamMonitoring();
}

function togglePlayPause() {
    if (video.paused || video.ended) {
        video.play();
    } else {
        video.pause();
    }
}

function updatePlayPauseButton() {
    playIcon.className = video.paused ? 'fas fa-play' : 'fas fa-pause';
}

function toggleFullScreen() {
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
            videoContainer.mozRequestFullScreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateFullscreenButton() {
    fullscreenIcon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
}

function startStreamMonitoring() {
    setInterval(checkStreamDelay, 1000);

    video.addEventListener('waiting', () => {
        updateLiveStatus(false);
    });

    video.addEventListener('playing', () => {
        if (!isLive) {
            setTimeout(() => {
                if (!video.paused) {
                    updateLiveStatus(true);
                }
            }, 500);
        }
    });
}

function checkStreamDelay() {
    if (!video.paused && shakaPlayer && shakaPlayer.getBufferedInfo) {
        const bufferInfo = shakaPlayer.getBufferedInfo();
        const currentTime = video.currentTime;

        if (bufferInfo.total.length > 0) {
            const lastBufferEnd = bufferInfo.total[bufferInfo.total.length - 1].end;
            const liveEdgeDelay = Math.max(0, lastBufferEnd - currentTime);

            if (liveEdgeDelay > 3) {
                updateLiveStatus(false, Math.floor(liveEdgeDelay));
            } else {
                updateLiveStatus(true);
            }
        }
    }
}

function updateLiveStatus(isLiveNow, delay = 0) {
    isLive = isLiveNow;

    if (isLiveNow) {
        liveIndicator.classList.remove('delayed');
        liveIndicator.style.display = 'flex';
        delayIndicator.classList.remove('visible');
        delayAmount = 0;
    } else {
        liveIndicator.style.display = 'none';
        delayIndicator.classList.add('visible');
        delayAmount = delay;
        delaySeconds.textContent = delay;
    }
}