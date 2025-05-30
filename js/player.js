let shakaPlayer = null;
let video = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

function initApp() {
    video = document.getElementById('player');
    
    setupCustomControls(); // From controls.js
    setupQualityControls(); // From quality.js

    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported!');
        document.getElementById('error').textContent = 'Browser not supported for video playback.';
        document.getElementById('error').style.display = 'block';
        return;
    }

    initPlayer();
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initPlayer() {
    const id = getParameterByName('id'); // From utils.js
    const config = ConfiguracionCanales[id]; // From channels.js

    if (!config) {
        document.getElementById('error').style.display = 'block';
        return;
    }

    shakaPlayer = new shaka.Player(video);
    shakaPlayer.addEventListener('error', onErrorEvent);
    shakaPlayer.addEventListener('trackschanged', () => {
        const tracks = shakaPlayer.getVariantTracks();
        updateQualityMenu(tracks); // From quality.js
    });

    // Add event listeners for video errors
    video.addEventListener('error', handleVideoError);
    video.addEventListener('stalled', handleVideoError);

    // Konfigurasi dasar
    const playerConfig = {
        streaming: {
            rebufferingGoal: isMobileDevice() ? 0.5 : 1,
            bufferingGoal: isMobileDevice() ? 3 : 5,
            bufferBehind: isMobileDevice() ? 5 : 10,
            lowLatencyMode: true,
            autoStart: true,
            buffering: {
                enabled: true,
                minBufferedTarget: isMobileDevice() ? 0.1 : 0.2,
                maxBufferedTarget: isMobileDevice() ? 3 : 5,
                bufferedTarget: isMobileDevice() ? 0.3 : 0.5
            },
            retryParameters: {
                maxAttempts: 3,
                baseDelay: 1000,
                backoffFactor: 1.5,
                fuzzFactor: 0.5
            }
        },
        abr: {
            enabled: true,
            defaultBandwidthEstimate: isMobileDevice() ? 800000 : 2000000,
            bandwidthUpgradeTarget: 0.9,
            bandwidthDowngradeTarget: 0.95,
            switchInterval: 2,
            restrictions: {
                minWidth: isMobileDevice() ? 320 : 640,
                minHeight: isMobileDevice() ? 180 : 360,
                minPixels: isMobileDevice() ? 320 * 180 : 640 * 360,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
            }
        },
        manifest: {
            dash: {
                ignoreMinBufferTime: true,
                ignoreSuggestedPresentationDelay: true,
                autoCorrectDrift: true,
                ignoreLiveEdge: true
            }
        }
    };

    // Terapkan konfigurasi
    shakaPlayer.configure(playerConfig);

    // Optimasi untuk iOS
    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;
    }

    if (config.type === "mpd" && config.keys && config.keys.length > 0) {
        const clearKeys = {};
        clearKeys[config.keys[0].k1] = config.keys[0].k2;
        shakaPlayer.configure({
            drm: {
                clearKeys: clearKeys,
                retryParameters: {
                    maxAttempts: 5,
                    baseDelay: 1000,
                    backoffFactor: 2
                }
            }
        });
    }

    shakaPlayer.load(config.url).then(() => {
        console.log('Video loaded successfully');
        document.getElementById('error').style.display = 'none';
        retryCount = 0; // Reset retry count on successful load
        video.play().catch(error => {
            console.log('Auto-play was prevented:', error);
            showControls(); // From controls.js
        });
    }).catch(onError);
}

function onErrorEvent(event) {
    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
    handleVideoError();
}

function handleVideoError() {
    console.log('Video error detected, retry count:', retryCount);
    if (retryCount < MAX_RETRIES) {
        retryCount++;
        document.getElementById('error').textContent = `Mencoba memuat ulang (${retryCount}/${MAX_RETRIES})...`;
        document.getElementById('error').style.display = 'block';
        
        // Stop current player
        if (shakaPlayer) {
            shakaPlayer.unload();
        }

        // Try to reload after delay
        setTimeout(() => {
            initPlayer();
        }, RETRY_DELAY);
    } else {
        document.getElementById('error').textContent = 'Gagal memuat video setelah beberapa kali mencoba.';
        document.getElementById('error').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', initApp);