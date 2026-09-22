// app.js - Universal client for Ohm Music Player
// Supports both standalone file:// execution and Node.js server.js execution

document.addEventListener('DOMContentLoaded', async function () {
    // Default initial songs catalog embedded directly for zero-dependency file:// support
    const DEFAULT_SONGS = [
        {
            id: 1,
            title: "Gulabi Aankhen",
            artist: "SANAM",
            featuring: "Sanam Puri",
            album: "Universally SANAM",
            duration: 225,
            lyrics: "Gulaabi aankhen jo teri dekhi, sharabi yeh dil ho gaya... Sambhalo mujhko o mere yaaro, sambhalna mushkil ho gaya! Dil mein mere khwaab tere, tasveer jaise ho deewaar pe.",
            cover_image: "covers/cover_1758376364_68ceb1ac311c5.jpg",
            audio_file: "music/audio_1758376364_68ceb1ac31a34.mp3"
        },
        {
            id: 2,
            title: "Main Agar Kahoon",
            artist: "Sonu Nigam & Shreya Ghoshal",
            featuring: "Vishal-Shekhar",
            album: "Om Shanti Om",
            duration: 328,
            lyrics: "Tumko paya hai to jaise khoya hoon, kehna chahoon bhi to tumse kya kahoon... Kisi zabaan mein bhi, woh lafz hi nahi, ki jinme tum ho kya tumhe bata sakoon.",
            cover_image: "covers/cover_1758376646_68ceb2c680363.png",
            audio_file: "music/audio_1758376646_68ceb2c680422.mp3"
        },
        {
            id: 3,
            title: "Aankhon Mein Teri Ajab Si",
            artist: "KK",
            featuring: "Vishal-Shekhar",
            album: "Om Shanti Om",
            duration: 261,
            lyrics: "Aankhon mein teri ajab si, ajab si adayein hain... Dil ko bana de jo patang saansein ye teri wo hawayein hain. Aayi aisi raat hai jo, behke behke jazbaat hain.",
            cover_image: "covers/cover_1758377106_68ceb492135d7.png",
            audio_file: "music/audio_1758377106_68ceb49213823.mp3"
        },
        {
            id: 4,
            title: "Qaafirana",
            artist: "Arijit Singh & Nikhita Gandhi",
            featuring: "Amit Trivedi",
            album: "Kedarnath",
            duration: 375,
            lyrics: "Inna sona kyun Rabb ne banaya... Aise tum mile ho, aise tum mile ho, jaise mil rahi ho itar se hawa... Qaafirana sa hai, ishq hai ya kya hai?",
            cover_image: "covers/cover_1758378731_68cebaeb54f53.png",
            audio_file: "music/audio_1758378731_68cebaeb55038.mp3"
        },
        {
            id: 5,
            title: "Gulaabo",
            artist: "Vishal Dadlani & Amit Trivedi",
            featuring: "Anusha Mani",
            album: "Shaandaar",
            duration: 299,
            lyrics: "Hey hey hey hey... Gulaabo zara itar gira do! Hey hey hey hey... Taal se taal mila do! Suraj ko daanto, sheetal kar do ji... Taaron ke pehle aane ki baari hai.",
            cover_image: "covers/cover_gulaabo.svg",
            audio_file: "music/Gulaabo - Full Video_ Shaandaar _ Alia Bhatt & Shahid Kapoor _ Vishal Dadlani _ Amit Trivedi.mp3"
        }
    ];

    let songs = [];

    // DOM Elements
    const toggleFormBtn = document.getElementById('toggleForm');
    const uploadForm = document.getElementById('uploadForm');
    const songForm = document.getElementById('songForm');
    const durationInput = document.getElementById('durationInput');
    const hiddenDuration = document.getElementById('duration');
    const audioFileInput = document.getElementById('audioFile');
    const coverImageInput = document.getElementById('coverImage');

    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.querySelector('.volume-control i:first-child');
    const progress = document.getElementById('progress');
    const progressContainer = document.getElementById('progressContainer');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const albumArt = document.getElementById('albumArt');
    const songTitle = document.getElementById('songTitle');
    const artistName = document.getElementById('artistName');
    const featuringArtists = document.getElementById('featuringArtists');
    const albumName = document.getElementById('albumName');
    const lyrics = document.getElementById('lyrics');
    const playlist = document.getElementById('playlist');

    const audioVisualizer = document.getElementById('audioVisualizer');
    const frequencyBars = document.getElementById('frequencyBars');

    // Player state
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffled = false;
    let isRepeating = false;
    let progressInterval = null;
    let currentTime = 0;
    let visualizerInterval = null;
    let lastVolume = 0.8;

    // Web Audio API
    let audio = null;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let bufferLength = 0;
    let audioSourceNode = null;
    let waves = document.querySelectorAll('.wave');

    // Auto-detect audio file duration on selection
    if (audioFileInput) {
        audioFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const tempAudio = new Audio();
                tempAudio.src = URL.createObjectURL(file);
                tempAudio.addEventListener('loadedmetadata', function () {
                    const secs = Math.round(tempAudio.duration);
                    if (secs && !isNaN(secs)) {
                        hiddenDuration.value = secs;
                        durationInput.value = formatTime(secs);
                    }
                    URL.revokeObjectURL(tempAudio.src);
                });
            }
        });
    }

    // Load initial songs list
    async function loadInitialSongs() {
        // Try server API first if running over http
        if (window.location.protocol.startsWith('http')) {
            try {
                const res = await fetch('/api/songs');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        songs = data;
                        renderPlaylist();
                        initPlayer();
                        return;
                    }
                }
            } catch (err) {
                console.log('Server API not reachable, falling back to local storage/defaults');
            }
        }

        // Try LocalStorage
        try {
            const local = localStorage.getItem('ohm_songs_v1');
            if (local) {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    songs = parsed;
                    renderPlaylist();
                    initPlayer();
                    return;
                }
            }
        } catch (e) {
            console.error('LocalStorage read error:', e);
        }

        // Default list
        songs = [...DEFAULT_SONGS];
        saveLocalSongs();
        renderPlaylist();
        initPlayer();
    }

    function saveLocalSongs() {
        try {
            localStorage.setItem('ohm_songs_v1', JSON.stringify(songs));
        } catch (e) {
            console.error('LocalStorage write error:', e);
        }
    }

    // Toggle Add Song Form
    if (toggleFormBtn && uploadForm) {
        toggleFormBtn.addEventListener('click', function () {
            uploadForm.classList.toggle('visible');
            if (uploadForm.classList.contains('visible')) {
                toggleFormBtn.innerHTML = '<i class="fas fa-times"></i> Close';
                uploadForm.scrollIntoView({ behavior: 'smooth' });
            } else {
                toggleFormBtn.innerHTML = '<i class="fas fa-plus"></i> Add Song';
            }
        });
    }

    // Duration input format handler (MM:SS to seconds)
    if (durationInput && hiddenDuration) {
        durationInput.addEventListener('input', function () {
            const val = this.value.trim();
            const match = val.match(/^(\d{1,2}):([0-5]\d)$/);
            if (match) {
                hiddenDuration.value = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
            } else {
                hiddenDuration.value = '';
            }
        });
    }

    // Render Playlist
    function renderPlaylist() {
        if (!playlist) return;
        playlist.innerHTML = '';

        if (!songs || songs.length === 0) {
            playlist.innerHTML = '<p style="color:#aaa; text-align:center; padding:15px;">No songs in playlist. Add some tracks above!</p>';
            return;
        }

        songs.forEach((song, idx) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${idx === currentSongIndex ? 'active' : ''}`;
            item.setAttribute('data-index', idx);

            const coverSrc = song.cover_image || 'https://placehold.co/100x100/3d3d62/ffffff?text=Music';
            const durText = song.duration ? formatTime(song.duration) : '--:--';

            item.innerHTML = `
                <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(song.title)}">
                <div class="playlist-info">
                    <h4>${escapeHtml(song.title)}</h4>
                    <p>${escapeHtml(song.artist)}${song.featuring ? ' · ' + escapeHtml(song.featuring) : ''}</p>
                </div>
                <div class="playlist-duration">${durText}</div>
                <div class="playlist-actions">
                    <button class="delete-btn" title="Delete Song" data-id="${song.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Click on playlist item to play
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn')) return; // handled separately
                if (currentSongIndex === idx && isPlaying) {
                    pauseSong();
                } else {
                    currentSongIndex = idx;
                    loadSong(currentSongIndex);
                    playSong();
                }
            });

            // Delete button handler
            const delBtn = item.querySelector('.delete-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSong(song.id);
                });
            }

            playlist.appendChild(item);
        });
    }

    // Web Audio Visualizer Setup
    function initAudioVisualization() {
        try {
            if (!audioContext) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                audioContext = new AudioCtx();
            }
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (audio && !audioSourceNode) {
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                audioSourceNode = audioContext.createMediaElementSource(audio);
                audioSourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
            }
        } catch (error) {
            console.log('Web Audio context note:', error.message);
        }
    }

    function createFrequencyBars() {
        if (!frequencyBars) return;
        frequencyBars.innerHTML = '';
        const barCount = window.innerWidth < 768 ? 24 : 38;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'freq-bar';
            bar.style.animationDelay = (i * 0.07) + 's';
            frequencyBars.appendChild(bar);
        }
    }

    function updateVisualizer() {
        if (!isPlaying || !frequencyBars) return;
        const bars = frequencyBars.querySelectorAll('.freq-bar');
        if (!bars || bars.length === 0) return;

        let volume = 0.4;
        let freqBands = [0.3, 0.4, 0.5, 0.4, 0.3, 0.4, 0.5, 0.4];

        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            volume = sum / bufferLength / 255;

            for (let b = 0; b < 8; b++) {
                let bandSum = 0;
                const start = b * Math.floor(bufferLength / 8);
                const end = (b + 1) * Math.floor(bufferLength / 8);
                for (let i = start; i < end; i++) bandSum += dataArray[i];
                freqBands[b] = bandSum / ((end - start) * 255);
            }

            bars.forEach((bar, index) => {
                const dataIndex = Math.floor((index / bars.length) * bufferLength);
                const val = dataArray[dataIndex] || 0;
                const barHeight = Math.max((val / 255) * 36, 6);
                bar.style.height = barHeight + 'px';
                bar.style.opacity = 0.2 + ((val / 255) * 0.6);
            });
        } else {
            // Simulated visualizer
            const songDur = songs[currentSongIndex]?.duration || 200;
            const timeProgress = (currentTime / songDur) || 0.1;
            const now = Date.now() / 1000;

            bars.forEach((bar, index) => {
                const offset = index / bars.length;
                const waveVal = Math.sin(now * 3 + offset * 8) * 0.5 + 0.5;
                const barHeight = Math.max(waveVal * 32, 6);
                bar.style.height = barHeight + 'px';
                bar.style.opacity = 0.2 + waveVal * 0.5;
            });
        }

        // Intensity update
        let intensity = volume < 0.25 ? 'low' : volume < 0.55 ? 'medium' : 'high';
        if (audioVisualizer) {
            audioVisualizer.className = `audio-visualizer active ${intensity}`;
        }

        // Sync background waves
        if (waves && waves.length > 0) {
            waves.forEach((wave, index) => {
                const band = freqBands[index % freqBands.length] || 0.3;
                const yOffset = band * -25 + Math.sin(Date.now() / 1800 + index) * 8;
                const scaleY = 1 + band * 0.35;
                const rotate = Math.sin(Date.now() / 2500 + index) * 2 * band;
                wave.style.transform = `translateY(${yOffset}px) scaleY(${scaleY}) rotate(${rotate}deg)`;
                wave.style.opacity = 0.6 + band * 0.4;
            });
        }
    }

    function startVisualization() {
        if (!audioVisualizer) return;
        audioVisualizer.classList.add('active');
        createFrequencyBars();
        waves = document.querySelectorAll('.wave');
        if (visualizerInterval) clearInterval(visualizerInterval);
        visualizerInterval = setInterval(updateVisualizer, 60);
    }

    function stopVisualization() {
        if (!audioVisualizer) return;
        audioVisualizer.className = 'audio-visualizer';
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            visualizerInterval = null;
        }
        if (waves) {
            waves.forEach(wave => {
                wave.style.transform = 'translateY(0) scaleY(1) rotate(0deg)';
                wave.style.opacity = '0.8';
            });
        }
        if (frequencyBars) {
            const bars = frequencyBars.querySelectorAll('.freq-bar');
            bars.forEach(bar => {
                bar.style.height = '6px';
                bar.style.opacity = '0.15';
            });
        }
    }

    // Initialize Player UI & Audio Element
    function initPlayer() {
        if (!songs || songs.length === 0) {
            renderPlaceholder();
            return;
        }
        loadSong(currentSongIndex);
    }

    function renderPlaceholder() {
        if (albumArt) albumArt.querySelector('img').src = "https://placehold.co/500x500/3d3d62/ffffff?text=No+Songs";
        if (songTitle) songTitle.textContent = "No Songs Available";
        if (artistName) artistName.textContent = "Please Add a Song";
        if (featuringArtists) featuringArtists.textContent = "";
        if (albumName) albumName.textContent = "";
        if (lyrics) lyrics.innerHTML = "<p>No songs found. Use '+ Add Song' to upload your favorite tracks!</p>";
        if (progress) progress.style.width = '0%';
        updateTimeDisplay(0, 0);
    }

    function loadSong(index) {
        if (!songs || songs.length === 0) {
            renderPlaceholder();
            return;
        }

        if (index < 0) index = 0;
        if (index >= songs.length) index = songs.length - 1;
        currentSongIndex = index;

        const song = songs[index];

        if (albumArt) albumArt.querySelector('img').src = song.cover_image || 'https://placehold.co/500x500/3d3d62/ffffff?text=Music';
        if (songTitle) songTitle.textContent = song.title;
        if (artistName) artistName.textContent = song.artist;
        if (featuringArtists) featuringArtists.textContent = song.featuring ? `(Feat. ${song.featuring})` : '';
        if (albumName) albumName.textContent = song.album || '';
        if (lyrics) lyrics.innerHTML = `<p>${escapeHtml(song.lyrics || 'No lyrics available for this track.')}</p>`;

        // Cleanup previous audio if any
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        if (song.audio_file) {
            audio = new Audio(song.audio_file);
            audio.preload = 'metadata';
            audioSourceNode = null; // will be recreated on user play

            audio.addEventListener('loadedmetadata', function () {
                const totalDur = audio.duration || song.duration || 0;
                updateTimeDisplay(0, totalDur);
            });

            audio.addEventListener('timeupdate', function () {
                if (isPlaying) {
                    currentTime = audio.currentTime;
                    const dur = audio.duration || song.duration || 1;
                    const percent = Math.min((currentTime / dur) * 100, 100);
                    if (progress) progress.style.width = `${percent}%`;
                    updateTimeDisplay(currentTime, dur);
                }
            });

            audio.addEventListener('ended', function () {
                if (isRepeating) {
                    audio.currentTime = 0;
                    audio.play();
                } else {
                    nextSong();
                }
            });

            audio.addEventListener('canplay', function () {
                if (isPlaying) {
                    audio.play().catch(e => console.log('Audio autoplay prevented:', e));
                }
            });

            if (volumeSlider) {
                audio.volume = volumeSlider.value / 100;
            }
        } else {
            audio = null;
        }

        if (progress) progress.style.width = '0%';
        currentTime = 0;
        updateTimeDisplay(0, song.duration || 0);

        // Highlight active item in playlist
        if (playlist) {
            const items = playlist.querySelectorAll('.playlist-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    function playSong() {
        if (!songs || songs.length === 0) return;
        isPlaying = true;
        if (playIcon) playIcon.className = 'fas fa-pause';
        if (albumArt) albumArt.classList.add('playing');

        startVisualization();

        if (audio && audio.src) {
            initAudioVisualization();
            audio.play().catch(err => {
                console.log('Direct audio play notice:', err);
                simulatePlayback();
            });
        } else {
            simulatePlayback();
        }
    }

    function pauseSong() {
        isPlaying = false;
        if (playIcon) playIcon.className = 'fas fa-play';
        if (albumArt) albumArt.classList.remove('playing');

        stopVisualization();

        if (audio) {
            audio.pause();
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function simulatePlayback() {
        if (progressInterval) clearInterval(progressInterval);
        const song = songs[currentSongIndex];
        const dur = (audio && audio.duration) || song.duration || 180;

        progressInterval = setInterval(() => {
            if (currentTime < dur) {
                currentTime += 1;
                const percent = (currentTime / dur) * 100;
                if (progress) progress.style.width = `${percent}%`;
                updateTimeDisplay(currentTime, dur);
            } else {
                if (isRepeating) {
                    currentTime = 0;
                    if (progress) progress.style.width = '0%';
                    updateTimeDisplay(0, dur);
                } else {
                    nextSong();
                }
            }
        }, 1000);
    }

    function nextSong() {
        if (!songs || songs.length === 0) return;
        stopVisualization();

        if (isShuffled && songs.length > 1) {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * songs.length);
            } while (nextIdx === currentSongIndex);
            currentSongIndex = nextIdx;
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }

        loadSong(currentSongIndex);
        if (isPlaying) playSong();
    }

    function prevSong() {
        if (!songs || songs.length === 0) return;
        stopVisualization();

        if (currentTime > 4 && audio) {
            // Seek to start if already played more than 4s
            audio.currentTime = 0;
            currentTime = 0;
            if (isPlaying) playSong();
            return;
        }

        if (isShuffled && songs.length > 1) {
            let prevIdx;
            do {
                prevIdx = Math.floor(Math.random() * songs.length);
            } while (prevIdx === currentSongIndex);
            currentSongIndex = prevIdx;
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }

        loadSong(currentSongIndex);
        if (isPlaying) playSong();
    }

    function updateTimeDisplay(current, total) {
        if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
        if (totalTimeEl) totalTimeEl.textContent = formatTime(total);
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function seekTo(percentage) {
        if (!songs || songs.length === 0) return;
        const song = songs[currentSongIndex];
        const dur = (audio && audio.duration) || song.duration || 180;
        const newTime = Math.max(0, Math.min(percentage * dur, dur));

        if (audio && !isNaN(audio.duration)) {
            audio.currentTime = newTime;
        }
        currentTime = newTime;
        if (progress) progress.style.width = `${percentage * 100}%`;
        updateTimeDisplay(newTime, dur);
    }

    // Delete song
    async function deleteSong(id) {
        if (!confirm('Are you sure you want to remove this song from the playlist?')) return;

        const idx = songs.findIndex(s => s.id === id);
        if (idx === -1) return;

        // Try server delete if on http
        if (window.location.protocol.startsWith('http')) {
            try {
                await fetch(`/api/songs/${id}`, { method: 'DELETE' });
            } catch (e) {
                console.log('Server delete skipped');
            }
        }

        const wasPlayingCurrent = (idx === currentSongIndex);
        if (wasPlayingCurrent) {
            pauseSong();
        }

        songs.splice(idx, 1);
        saveLocalSongs();

        if (songs.length === 0) {
            currentSongIndex = 0;
            renderPlaylist();
            renderPlaceholder();
        } else {
            if (wasPlayingCurrent) {
                currentSongIndex = currentSongIndex >= songs.length ? 0 : currentSongIndex;
                loadSong(currentSongIndex);
            } else if (idx < currentSongIndex) {
                currentSongIndex--;
            }
            renderPlaylist();
        }

        showMessage('Song removed successfully!');
    }

    // Helper: read file as Data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Add Song Form Handler
    if (songForm) {
        songForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const title = document.getElementById('newSongTitle').value.trim();
            const artist = document.getElementById('newArtistName').value.trim();
            const featuring = document.getElementById('newFeaturing').value.trim();
            const album = document.getElementById('newAlbum').value.trim();
            const lyricsVal = document.getElementById('newLyrics').value.trim();
            const durationVal = parseInt(hiddenDuration.value, 10) || 0;

            const audioFile = audioFileInput?.files[0];
            const coverFile = coverImageInput?.files[0];

            if (!title || !artist || !album) {
                alert('Please fill out all required fields (*)');
                return;
            }

            if (!audioFile) {
                alert('Please choose an audio file to upload!');
                return;
            }

            showMessage('Processing upload, please wait...');

            try {
                let audioUrl = '';
                let coverUrl = 'https://placehold.co/500x500/3d3d62/ffffff?text=' + encodeURIComponent(title);
                let audioData = null;
                let coverData = null;

                // Read Audio Data
                audioData = await readFileAsDataURL(audioFile);
                audioUrl = audioData; // Direct Base64 data URI works everywhere

                // Read Cover Data if present
                if (coverFile) {
                    coverData = await readFileAsDataURL(coverFile);
                    coverUrl = coverData;
                }

                // If running on local Node server, attempt API save
                if (window.location.protocol.startsWith('http')) {
                    try {
                        const payload = {
                            title,
                            artist,
                            featuring,
                            album,
                            duration: durationVal,
                            lyrics: lyricsVal,
                            audioData,
                            audioName: audioFile.name,
                            coverData,
                            coverName: coverFile ? coverFile.name : null
                        };

                        const res = await fetch('/api/songs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            const result = await res.json();
                            if (result.song) {
                                songs.push(result.song);
                                saveLocalSongs();
                                finishAddSong();
                                return;
                            }
                        }
                    } catch (netErr) {
                        console.log('Server upload fallback to client storage:', netErr);
                    }
                }

                // Client-side fallback storage
                const newSong = {
                    id: Date.now(),
                    title,
                    artist,
                    featuring,
                    album,
                    duration: durationVal,
                    lyrics: lyricsVal,
                    cover_image: coverUrl,
                    audio_file: audioUrl
                };

                songs.push(newSong);
                saveLocalSongs();
                finishAddSong();

            } catch (err) {
                console.error('Error adding song:', err);
                alert('Failed to process file: ' + err.message);
            }
        });
    }

    function finishAddSong() {
        songForm.reset();
        hiddenDuration.value = '';
        if (uploadForm) uploadForm.classList.remove('visible');
        if (toggleFormBtn) toggleFormBtn.innerHTML = '<i class="fas fa-plus"></i> Add Song';

        renderPlaylist();
        showMessage('Song added successfully!');

        // If it was empty, load this song immediately
        if (songs.length === 1) {
            loadSong(0);
        }
    }

    function showMessage(text) {
        let msg = document.querySelector('.message');
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'message';
            const container = document.querySelector('.container');
            if (container) container.insertBefore(msg, container.firstChild);
        }
        msg.textContent = text;
        msg.style.opacity = '1';
        msg.style.transform = 'translateY(0)';

        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (msg.parentNode) msg.parentNode.removeChild(msg);
            }, 300);
        }, 4000);
    }

    // Playback control event listeners
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                pauseSong();
            } else {
                playSong();
            }
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSong);
    if (nextBtn) nextBtn.addEventListener('click', nextSong);

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            isShuffled = !isShuffled;
            shuffleBtn.style.color = isShuffled ? '#e94560' : '#fff';
            showMessage(isShuffled ? 'Shuffle Enabled' : 'Shuffle Disabled');
        });
    }

    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            isRepeating = !isRepeating;
            repeatBtn.style.color = isRepeating ? '#e94560' : '#fff';
            showMessage(isRepeating ? 'Repeat Song Enabled' : 'Repeat Song Disabled');
        });
    }

    // Seek on progress container click
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
            seekTo(percentage);
        });
    }

    // Volume Slider & Mute Toggle
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            const val = volumeSlider.value / 100;
            if (audio) audio.volume = val;
            lastVolume = val > 0 ? val : lastVolume;
            updateVolumeIcon(val);
        });
    }

    if (volumeIcon) {
        volumeIcon.style.cursor = 'pointer';
        volumeIcon.title = 'Mute/Unmute';
        volumeIcon.addEventListener('click', () => {
            if (!volumeSlider) return;
            if (volumeSlider.value > 0) {
                lastVolume = volumeSlider.value / 100;
                volumeSlider.value = 0;
                if (audio) audio.volume = 0;
                updateVolumeIcon(0);
            } else {
                const restore = lastVolume || 0.8;
                volumeSlider.value = restore * 100;
                if (audio) audio.volume = restore;
                updateVolumeIcon(restore);
            }
        });
    }

    function updateVolumeIcon(vol) {
        if (!volumeIcon) return;
        if (vol === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (vol < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', function (e) {
        // Ignore typing in input or textarea
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                isPlaying ? pauseSong() : playSong();
                break;
            case 'ArrowRight':
                e.preventDefault();
                seekTo(((currentTime + 5) / (songs[currentSongIndex]?.duration || 180)));
                break;
            case 'ArrowLeft':
                e.preventDefault();
                seekTo(((currentTime - 5) / (songs[currentSongIndex]?.duration || 180)));
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (volumeSlider) {
                    volumeSlider.value = Math.min(100, parseInt(volumeSlider.value, 10) + 5);
                    volumeSlider.dispatchEvent(new Event('input'));
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (volumeSlider) {
                    volumeSlider.value = Math.max(0, parseInt(volumeSlider.value, 10) - 5);
                    volumeSlider.dispatchEvent(new Event('input'));
                }
                break;
            case 'KeyN':
                nextSong();
                break;
            case 'KeyP':
                prevSong();
                break;
            case 'KeyM':
                if (volumeIcon) volumeIcon.click();
                break;
        }
    });

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Start everything!
    await loadInitialSongs();
});
