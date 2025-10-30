document.addEventListener('DOMContentLoaded', function() {
    // Toggle form visibility
    const toggleFormBtn = document.getElementById('toggleForm');
    const uploadForm = document.getElementById('uploadForm');
    const durationInput = document.getElementById('durationInput');
    const hiddenDuration = document.getElementById('duration');
    let waves = null; // To select .wave elements
    
    if (toggleFormBtn && uploadForm) {
        toggleFormBtn.addEventListener('click', function() {
            uploadForm.classList.toggle('visible');
            
            if (uploadForm.classList.contains('visible')) {
                toggleFormBtn.innerHTML = '<i class="fas fa-times"></i> Close';
            } else {
                toggleFormBtn.innerHTML = '<i class="fas fa-plus"></i> Add Song';
            }
        });
    }
    
    // Duration input conversion (MM:SS to seconds)
    if (durationInput && hiddenDuration) {
        durationInput.addEventListener('input', function() {
            const timeValue = this.value;
            const timePattern = /^(\d{1,2}):([0-5]\d)$/;
            
            if (timePattern.test(timeValue)) {
                const [, minutes, seconds] = timeValue.match(timePattern);
                const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
                hiddenDuration.value = totalSeconds;
            } else {
                hiddenDuration.value = '';
            }
        });
    }
    
    // Player elements
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeSlider = document.getElementById('volumeSlider');
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
    
    // Audio Visualizer elements
    const audioVisualizer = document.getElementById('audioVisualizer');
    const frequencyBars = document.getElementById('frequencyBars');
    
    // Player state
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffled = false;
    let isRepeating = false;
    let progressInterval;
    let currentTime = 0;
    let visualizerInterval;
    
    // Audio context for visualization
    let audioContext;
    let analyser;
    let dataArray;
    let bufferLength;
    
    // Audio element for actual playback
    let audio = null;
    
    // Initialize audio visualization
    function initAudioVisualization() {
        try {
            if (!audioContext && audio) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                
                analyser.fftSize = 256;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
            }
        } catch (error) {
            console.log('Audio visualization not supported:', error);
            // Fall back to simulated visualization
        }
    }
    
    // Create frequency bars - fewer bars for cleaner look
    function createFrequencyBars() {
        if (!frequencyBars) return;
        
        frequencyBars.innerHTML = '';
        const barCount = window.innerWidth < 768 ? 25 : 40;
        
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'freq-bar';
            bar.style.animationDelay = (i * 0.08) + 's';
            frequencyBars.appendChild(bar);
        }
    }
    
    // Update visualizer - more subtle and smooth
    function updateVisualizer() {
    if (!isPlaying || !frequencyBars || !waves) return;
    
    const bars = frequencyBars.querySelectorAll('.freq-bar');
    let intensity = 'medium';
    let volume = 0.5;
    let freqBands = []; // For wave syncing
    
    if (analyser && dataArray) {
        // Real audio data
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate overall volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        volume = sum / bufferLength / 255;
        
        // Calculate frequency bands (for 8 waves)
        for (let b = 0; b < 8; b++) {
            let bandSum = 0;
            const start = b * Math.floor(bufferLength / 8);
            const end = (b + 1) * Math.floor(bufferLength / 8);
            for (let i = start; i < end; i++) {
                bandSum += dataArray[i];
            }
            freqBands[b] = bandSum / ((end - start) * 255);
        }
        
        // Update frequency bars (existing, subtle)
        bars.forEach((bar, index) => {
            const dataIndex = Math.floor((index / bars.length) * bufferLength);
            const barHeight = Math.max((dataArray[dataIndex] / 255) * 30, 6);
            bar.style.height = barHeight + 'px';
            bar.style.opacity = 0.2 + ((dataArray[dataIndex] / 255) * 0.3);
        });
    } else {
        // Simulation
        const timeProgress = currentTime / songs[currentSongIndex].duration;
        
        // Simulated waves (existing)
        const wave1 = Math.sin(timeProgress * Math.PI * 6) * 0.3 + 0.4;
        const wave2 = Math.cos(timeProgress * Math.PI * 8) * 0.2 + 0.3;
        const wave3 = Math.sin(timeProgress * Math.PI * 10) * 0.25 + 0.35;
        volume = (wave1 + wave2 + wave3) / 3;
        
        // Simulated freq bands for waves
        for (let b = 0; b < 8; b++) {
            freqBands[b] = Math.sin(timeProgress * Math.PI * (2 + b) + b) * 0.3 + 0.4;
        }
        
        // Update frequency bars (existing simulation)
        bars.forEach((bar, index) => {
            const barPosition = index / bars.length;
            const waveOffset = timeProgress * 2 + barPosition * Math.PI * 2;
            const amplitude1 = Math.sin(waveOffset) * 0.4 + 0.3;
            const amplitude2 = Math.sin(waveOffset * 1.5 + Math.PI/3) * 0.3 + 0.2;
            const amplitude3 = Math.sin(waveOffset * 0.8 + Math.PI/6) * 0.2 + 0.25;
            const combinedAmplitude = (amplitude1 + amplitude2 + amplitude3) / 3;
            const barHeight = Math.max(combinedAmplitude * 25, 5);
            bar.style.height = barHeight + 'px';
            bar.style.opacity = 0.15 + (combinedAmplitude * 0.25);
        });
    }
    
    // Determine intensity (existing)
    if (volume < 0.3) {
        intensity = 'low';
    } else if (volume < 0.6) {
        intensity = 'medium';
    } else {
        intensity = 'high';
    }
    
    if (audioVisualizer) {
        audioVisualizer.className = `audio-visualizer active ${intensity}`;
        
        // Occasional variation (existing)
        if (Math.random() < 0.05) {
            const intensities = ['low', 'medium', 'high'];
            const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];
            audioVisualizer.className = `audio-visualizer active ${randomIntensity}`;
            setTimeout(() => {
                if (isPlaying && audioVisualizer) {
                    audioVisualizer.className = `audio-visualizer active ${intensity}`;
                }
            }, 300);
        }
    }
    
    // Sync waves with freq bands (new: dynamic movement/scale/opacity)
    waves.forEach((wave, index) => {
        const band = freqBands[index % freqBands.length]; // Cycle bands if fewer
        const yOffset = band * -30 + Math.sin(Date.now() / 2000 + index) * 10; // Vertical sync + gentle sine
        const scaleY = 1 + band * 0.4; // Scale with band intensity
        const rotate = Math.sin(Date.now() / 3000 + index) * 2 * band; // Subtle rotate sync
        wave.style.transform = `translateY(${yOffset}px) scaleY(${scaleY}) rotate(${rotate}deg)`;
        wave.style.opacity = 0.6 + band * 0.4; // Opacity pulse
    });
}
    
    // Start visualization
    function startVisualization() {
        if (!audioVisualizer) return;
        
        audioVisualizer.classList.add('active');
        createFrequencyBars();
        waves = document.querySelectorAll('.wave');
        
        visualizerInterval = setInterval(updateVisualizer, 80);
    }
    
    // Stop visualization
    function stopVisualization() {
        if (!audioVisualizer || !frequencyBars) return;
        
        audioVisualizer.classList.remove('active');
        audioVisualizer.className = 'audio-visualizer';
        
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            if (waves) {
    waves.forEach(wave => {
        wave.style.transform = 'translateY(0) scaleY(1) rotate(0deg)';
        wave.style.opacity = '0.8';
    });
}
            visualizerInterval = null;
        }
        
        // Reset frequency bars to minimal state
        const bars = frequencyBars.querySelectorAll('.freq-bar');
        bars.forEach(bar => {
            bar.style.height = '6px';
            bar.style.opacity = '0.15';
        });
    }
    
    // Initialize player
    function initPlayer() {
        if (typeof songs === 'undefined' || !songs || songs.length === 0) {
            console.error('Songs array not found or empty');
            return;
        }
        
        loadSong(currentSongIndex);
        updateTimeDisplay(0, songs[currentSongIndex].duration);
        setupPlaylistEventListeners();
    }
    
    // Load song details and audio
    function loadSong(index) {
        if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) {
            // Show placeholder message
            if (albumArt) albumArt.querySelector('img').src = "https://placehold.co/500x500/3d3d62/ffffff?text=No+Songs";
            if (songTitle) songTitle.textContent = "No Songs Available";
            if (artistName) artistName.textContent = "Please Add a Song";
            if (featuringArtists) featuringArtists.textContent = "";
            if (albumName) albumName.textContent = "";
            if (lyrics) lyrics.innerHTML = "<p>No songs in the database. Use the 'Add Song' button to upload your first track!</p>";
            if (progress) progress.style.width = '0%';
            updateTimeDisplay(0, 0);
            return;
        }
        
        const song = songs[index];
        
        // Update UI
        if (albumArt) albumArt.querySelector('img').src = song.cover_image;
        if (songTitle) songTitle.textContent = song.title;
        if (artistName) artistName.textContent = song.artist;
        if (featuringArtists) featuringArtists.textContent = song.featuring;
        if (albumName) albumName.textContent = song.album;
        if (lyrics) lyrics.innerHTML = `<p>${song.lyrics}</p>`;
        
        // Load audio file
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        if (song.audio_file) {
            audio = new Audio(song.audio_file);
            
            // Audio event listeners
            audio.addEventListener('loadedmetadata', function() {
                updateTimeDisplay(0, audio.duration || song.duration);
            });
            
            audio.addEventListener('timeupdate', function() {
                if (isPlaying) {
                    currentTime = audio.currentTime;
                    const progressPercent = (currentTime / audio.duration) * 100;
                    if (progress) progress.style.width = `${progressPercent}%`;
                    updateTimeDisplay(currentTime, audio.duration);
                }
            });
            
            audio.addEventListener('ended', function() {
                if (isRepeating) {
                    audio.currentTime = 0;
                    audio.play();
                } else {
                    nextSong();
                }
            });
            
            audio.addEventListener('canplay', function() {
                if (isPlaying) {
                    audio.play();
                }
            });
            
            // Set volume
            if (volumeSlider) {
                audio.volume = volumeSlider.value / 100;
            }
        } else {
            audio = null;
        }
        
        // Reset progress
        if (progress) progress.style.width = '0%';
        currentTime = 0;
        updateTimeDisplay(0, song.duration);
        
        // Update active song in playlist
        if (playlist) {
            const playlistItems = playlist.querySelectorAll('.playlist-item');
            playlistItems.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }
    
    // Setup playlist event listeners
    function setupPlaylistEventListeners() {
        if (!playlist) return;
        
        const playlistItems = playlist.querySelectorAll('.playlist-item');
        playlistItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Stop current visualizer
                if (isPlaying) {
                    stopVisualization();
                }
                
                currentSongIndex = index;
                loadSong(currentSongIndex);
                if (isPlaying && audio) {
                    playSong();
                }
            });
        });
    }
    
    // Play song
    function playSong() {
        if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
        
        isPlaying = true;
        if (playIcon) playIcon.className = 'fas fa-pause';
        if (albumArt) albumArt.classList.add('playing');
        
        // Start visualization
        startVisualization();
        
        if (audio && audio.src) {
            // Initialize audio visualization for real audio
            initAudioVisualization();
            
            audio.play().catch(error => {
                console.log('Audio play failed:', error);
                // Fallback to simulation for demo
                simulatePlayback();
            });
        } else {
            // Fallback to simulation for demo
            simulatePlayback();
        }
    }
    
    // Fallback simulation for when audio files aren't available
    function simulatePlayback() {
        clearInterval(progressInterval);
        
        progressInterval = setInterval(() => {
            if (currentTime < songs[currentSongIndex].duration) {
                currentTime += 1;
                const progressPercent = (currentTime / songs[currentSongIndex].duration) * 100;
                if (progress) progress.style.width = `${progressPercent}%`;
                updateTimeDisplay(currentTime, songs[currentSongIndex].duration);
            } else {
                if (isRepeating) {
                    currentTime = 0;
                    if (progress) progress.style.width = '0%';
                    updateTimeDisplay(0, songs[currentSongIndex].duration);
                } else {
                    nextSong();
                }
            }
        }, 1000);
    }
    
    // Pause song
    function pauseSong() {
        isPlaying = false;
        if (playIcon) playIcon.className = 'fas fa-play';
        if (albumArt) albumArt.classList.remove('playing');
        
        // Stop visualization
        stopVisualization();
        
        if (audio) {
            audio.pause();
        } else {
            clearInterval(progressInterval);
        }
    }
    
    // Next song
    function nextSong() {
        if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
        
        // Stop current visualizer
        if (isPlaying) {
            stopVisualization();
        }
        
        if (isShuffled) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * songs.length);
            } while (newIndex === currentSongIndex && songs.length > 1);
            
            currentSongIndex = newIndex;
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }
    
    // Previous song
    function prevSong() {
        if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
        
        // Stop current visualizer
        if (isPlaying) {
            stopVisualization();
        }
        
        if (isShuffled) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * songs.length);
            } while (newIndex === currentSongIndex && songs.length > 1);
            
            currentSongIndex = newIndex;
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }
    
    // Update time display
    function updateTimeDisplay(current, total) {
        if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
        if (totalTimeEl) totalTimeEl.textContent = formatTime(total);
    }
    
    // Format time in mm:ss
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Seek to specific time
    function seekTo(percentage) {
        if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
        
        const duration = audio ? audio.duration : songs[currentSongIndex].duration;
        const newTime = percentage * duration;
        
        if (audio) {
            audio.currentTime = newTime;
        } else {
            currentTime = newTime;
        }
        
        if (progress) progress.style.width = `${percentage * 100}%`;
        updateTimeDisplay(newTime, duration);
    }
    
    // Event listeners
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
            
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
        });
    }
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            isRepeating = !isRepeating;
            repeatBtn.style.color = isRepeating ? '#e94560' : '#fff';
        });
    }
    
    // Progress bar click to seek
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            if (typeof songs === 'undefined' || !songs || songs.length === 0 || songs[0].id === 0) return;
            
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            const percentage = clickX / width;
            
            seekTo(percentage);
        });
    }
    
    // Volume control
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            if (audio) {
                audio.volume = volumeSlider.value / 100;
            }
        });
    }
    
    // Form validation for time format
    const songForm = document.getElementById('songForm');
    if (songForm && hiddenDuration && durationInput) {
        songForm.addEventListener('submit', function(e) {
            if (!hiddenDuration.value) {
                e.preventDefault();
                alert('Please enter a valid duration in MM:SS format');
                durationInput.focus();
            }
        });
    }
    
    // Auto-hide message after 5 seconds
    const message = document.querySelector('.message');
    if (message) {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    }
    
    // Initialize the player
    initPlayer();
});