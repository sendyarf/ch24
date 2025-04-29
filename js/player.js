let shakaPlayer = null;
let video = null;

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

    shakaPlayer.configure({
        streaming: {
            rebufferingGoal: 2,
            bufferingGoal: 10,
            bufferBehind: 30,
            lowLatencyMode: true
        }
    });

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
        video.play().catch(e => {
            console.log('Auto-play was prevented');
            showControls(); // From controls.js
        });
    }).catch(onError);
}

function onErrorEvent(event) {
    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
    document.getElementById('error').textContent = 'Error loading video: ' + error.message;
    document.getElementById('error').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initApp);