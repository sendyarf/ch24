let qualityBtn = null;
let qualityMenu = null;
let qualityOptions = null;
let autoQuality = null;
let availableQualities = [];
let currentQuality = "auto";

function setupQualityControls() {
    qualityBtn = document.getElementById('qualityBtn');
    qualityMenu = document.getElementById('qualityMenu');
    qualityOptions = document.getElementById('qualityOptions');
    autoQuality = document.getElementById('autoQuality');

    qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qualityMenu.classList.toggle('visible');
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            document.querySelector('.video-controls').classList.remove('visible');
            qualityMenu.classList.remove('visible');
        }, 5000);
    });

    document.addEventListener('click', (e) => {
        if (!qualityMenu.contains(e.target) && e.target !== qualityBtn) {
            qualityMenu.classList.remove('visible');
        }
    });

    autoQuality.addEventListener('click', () => {
        setVideoQuality('auto');
        updateActiveQuality('auto');
    });
}

function updateQualityMenu(tracks) {
    availableQualities = [];
    while (qualityOptions.firstChild) {
        qualityOptions.removeChild(qualityOptions.firstChild);
    }

    if (!tracks || tracks.length === 0) return;

    tracks.sort((a, b) => b.height - a.height);
    const bestQualityByResolution = {};

    tracks.forEach(track => {
        if (track.type === 'variant' && track.height) {
            const resolution = track.height;
            if (!bestQualityByResolution[resolution] || 
                track.bandwidth > bestQualityByResolution[resolution].bandwidth) {
                bestQualityByResolution[resolution] = {
                    height: resolution,
                    bandwidth: track.bandwidth
                };
            }
        }
    });

    Object.values(bestQualityByResolution)
        .sort((a, b) => b.height - a.height)
        .forEach(quality => {
            const qualityName = `${quality.height}p`;
            availableQualities.push({
                name: qualityName,
                height: quality.height,
                bandwidth: quality.bandwidth
            });

            const qualityItem = document.createElement('div');
            qualityItem.className = 'quality-menu-item';
            qualityItem.innerHTML = `<i class="fas fa-circle-thin"></i> ${qualityName}`;
            qualityItem.dataset.quality = qualityName;
            qualityItem.dataset.height = quality.height;
            qualityItem.dataset.bandwidth = quality.bandwidth;

            qualityItem.addEventListener('click', function() {
                const quality = this.dataset.quality;
                setVideoQuality(quality, parseInt(this.dataset.height), parseInt(this.dataset.bandwidth));
                updateActiveQuality(quality);
            });

            qualityOptions.appendChild(qualityItem);
        });

    updateActiveQuality('auto');
}

function updateActiveQuality(quality) {
    const items = document.querySelectorAll('.quality-menu-item');
    items.forEach(item => {
        item.classList.remove('active');
        const icon = item.querySelector('i');
        if (icon) icon.className = 'fas fa-circle-thin';
    });

    if (quality === 'auto') {
        autoQuality.classList.add('active');
        const icon = autoQuality.querySelector('i');
        if (icon) icon.className = 'fas fa-check';
    } else {
        const selectedItem = document.querySelector(`.quality-menu-item[data-quality="${quality}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
            const icon = selectedItem.querySelector('i');
            if (icon) icon.className = 'fas fa-check';
        }
    }

    currentQuality = quality;
}

function setVideoQuality(quality, height, bandwidth) {
    if (!shakaPlayer) return;

    if (quality === 'auto') {
        shakaPlayer.configure('abr.enabled', true);
        console.log('Set quality to Auto');
    } else {
        shakaPlayer.configure('abr.enabled', false);
        const tracks = shakaPlayer.getVariantTracks();
        const selectedTrack = tracks.find(track => 
            track.height === height && track.bandwidth === bandwidth);

        if (selectedTrack) {
            shakaPlayer.selectVariantTrack(selectedTrack, false);
            console.log(`Set quality to ${quality} (${selectedTrack.height}p)`);
        }
    }

    qualityMenu.classList.remove('visible');
    showControls(); // From controls.js
}