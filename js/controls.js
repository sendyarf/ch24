let playPauseBtn = null;
let playIcon = null;
let liveIndicator = null;
let delayIndicator = null;
let fullscreenBtn = null;
let fullscreenIcon = null;
let videoContainer = null;
let delaySeconds = null;
let volumeBtn = null;
let volumeIcon = null;
let volumeSlider = null;
let volumeSliderContainer = null;
let contextMenu = null;
let videoInfo = null;
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
    volumeBtn = document.getElementById('volumeBtn');
    volumeIcon = document.getElementById('volumeIcon');
    volumeSlider = document.getElementById('volumeSlider');
    volumeSliderContainer = document.getElementById('volumeSliderContainer');
    contextMenu = document.getElementById('contextMenu');
    videoInfo = document.getElementById('videoInfo');

    // Initialize video volume
    video.volume = 1.0;
    video.muted = false;
    volumeSlider.value = 100;

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
        volumeSliderContainer.classList.remove('visible');
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

    setupVolumeControls();
    setupContextMenu();
    startStreamMonitoring();
}

function setupVolumeControls() {
    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        volumeSliderContainer.classList.toggle('visible');
        showControls();
    });

    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        video.volume = volume;
        video.muted = volume === 0;
        updateVolumeIcon(volume);
        volumeSlider.style.setProperty('--volume', `${volumeSlider.value}%`);
    });

    volumeSlider.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    volumeSliderContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (!volumeSliderContainer.contains(e.target) && e.target !== volumeBtn && !volumeSlider.contains(e.target)) {
            volumeSliderContainer.classList.remove('visible');
        }
    });

    // Update icon and slider on volume change
    video.addEventListener('volumechange', () => {
        const volume = video.muted ? 0 : video.volume;
        volumeSlider.value = volume * 100;
        volumeSlider.style.setProperty('--volume', `${volume * 100}%`);
        updateVolumeIcon(volume);
    });

    // Initialize volume icon and slider
    updateVolumeIcon(video.volume);
    volumeSlider.style.setProperty('--volume', `${video.volume * 100}%`);
}

function updateVolumeIcon(volume) {
    if (video.muted || volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function setupContextMenu() {
    video.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.classList.add('visible');

        // Update video info
        const id = getParameterByName('id');
        const config = ConfiguracionCanales[id];
        const title = config ? config.title : 'Unknown';
        const status = isLive ? 'LIVE' : `Delayed (${delayAmount}s)`;
        const resolution = currentQuality === 'auto' ? 'Auto' : currentQuality;
        videoInfo.textContent = `Judul: ${title} | Resolusi: ${resolution} | Status: ${status}`;
    });

    // Close context menu on any click outside the menu
    document.addEventListener('click', (e) => {
        if (contextMenu.classList.contains('visible') && !contextMenu.contains(e.target)) {
            contextMenu.classList.remove('visible');
        }
    });

    // Close context menu on right-click outside the menu
    document.addEventListener('contextmenu', (e) => {
        if (contextMenu.classList.contains('visible') && !contextMenu.contains(e.target) && e.target !== video) {
            e.preventDefault();
            contextMenu.classList.remove('visible');
        }
    });
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

function showControls() {
    const controls = document.querySelector('.video-controls');
    clearTimeout(controlsTimeout);
    controls.classList.add('visible');
    controlsTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
    const controls = document.querySelector('.video-controls');
    controls.classList.remove('visible');
    document.getElementById('qualityMenu').classList.remove('visible');
    volumeSliderContainer.classList.remove('visible');
}