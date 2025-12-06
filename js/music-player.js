// LECTEUR DE MUSIQUE
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeIcon = document.getElementById('volumeIcon');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.musicPlayer = document.getElementById('musicPlayer');
        this.equalizer = document.getElementById('equalizer');
        this.notification = null; // notification toast supprimée

        this.isPlaying = false;
        this.currentSongIndex = 0;
        this.isShuffled = false;
        this.isMinimized = false;
        this.loadTimeout = null;

        // PLAYLIST AVEC MES FICHIERS
        this.playlist = [
            {
                title: "Nightcall",
                artist: "Kavinsky",
                src: "./assets/music/nightcall.mp3" // Utilisez ./ au début
            },
            {
                title: "Blinding Lights",
                artist: "The Weeknd",
                src: "./assets/music/blindinglights.mp3"
            },
            {
                title: "Instant Crush",
                artist: "Daft Punk",
                src: "./assets/music/instantcrush.mp3"
            }
        ];

        this.init();
    }

    init() {
        if (!this.audio || !this.playPauseBtn) {
            console.error('Éléments du lecteur manquants');
            return;
        }

        // Vidage des sources HTML pour éviter les erreurs
        this.audio.src = '';
        this.audio.load();

        this.loadCurrentSong();
        this.setupEventListeners();
        this.setupAudioEventListeners();
        this.setVolume(30);

        this.equalizer?.classList.add('paused');
    }

    setupEventListeners() {
        this.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn?.addEventListener('click', () => this.previousSong());
        this.nextBtn?.addEventListener('click', () => this.nextSong());
        this.shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
        this.minimizeBtn?.addEventListener('click', () => this.toggleMinimize());
        this.progressContainer?.addEventListener('click', (e) => this.setProgress(e));
        this.volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.volumeIcon?.addEventListener('click', () => this.toggleMute());

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupAudioEventListeners() {
        this.audio.addEventListener('loadstart', () => {
            console.log('🔄 Début du chargement...');

            // Timeout de sécurité (10 secondes)
            this.loadTimeout = setTimeout(() => {
                console.log('⏰ Timeout de chargement');
                this.nextSong();
            }, 10000);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            clearTimeout(this.loadTimeout);
            this.updateTotalTime();
            console.log('✅ Métadonnées chargées:', this.playlist[this.currentSongIndex].title);
        });

        this.audio.addEventListener('loadeddata', () => {
            clearTimeout(this.loadTimeout);
            console.log('✅ Données audio chargées');
        });

        this.audio.addEventListener('canplay', () => {
            clearTimeout(this.loadTimeout);
            console.log('✅ Peut être joué');
        });

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.audio.addEventListener('play', () => this.updatePlayState(true));
        this.audio.addEventListener('pause', () => this.updatePlayState(false));

        this.audio.addEventListener('error', (e) => {
            clearTimeout(this.loadTimeout);
            console.error('❌ Erreur audio:', e);
            const currentSong = this.playlist[this.currentSongIndex];

            // Diagnostic détaillé
            this.diagnoseError(currentSong.src);

            setTimeout(() => {
                if (this.playlist.length > 1) {
                    this.nextSong();
                }
            }, 3000);
        });
    }

    async diagnoseError(src) {
        console.log('🔍 DIAGNOSTIC pour:', src);

        try {
            // Test de fetch pour vérifier si le fichier existe
            const response = await fetch(src, { method: 'HEAD' });

            if (response.ok) {
                console.log('✅ Fichier accessible via fetch');
                console.log('📄 Content-Type:', response.headers.get('content-type'));
                console.log('📏 Content-Length:', response.headers.get('content-length'));
            } else {
                console.log('❌ Fichier non accessible:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('❌ Erreur de réseau:', error);
        }
    }

    loadCurrentSong() {
        if (!this.playlist[this.currentSongIndex]) {
            console.error('Chanson introuvable');
            return;
        }

        const currentSong = this.playlist[this.currentSongIndex];
        console.log('🔄 Chargement:', currentSong.title, 'depuis:', currentSong.src);

        // Vérifier si le chemin semble correct
        if (!currentSong.src.includes('.mp3') && !currentSong.src.includes('.ogg') && !currentSong.src.includes('.wav')) {
            console.warn('⚠️ Extension audio non trouvée dans:', currentSong.src);
        }

        this.audio.src = currentSong.src;
        this.songTitle.textContent = currentSong.title;
        this.songArtist.textContent = currentSong.artist;

        this.progressBar.style.width = '0%';
        this.currentTimeEl.textContent = '0:00';
        this.totalTimeEl.textContent = '0:00';

        // Forcer le rechargement
        this.audio.load();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            // Attendre que l'audio soit prêt
            if (this.audio.readyState === 0) {

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

                    const onCanPlay = () => {
                        clearTimeout(timeout);
                        this.audio.removeEventListener('canplay', onCanPlay);
                        this.audio.removeEventListener('error', onError);
                        resolve();
                    };

                    const onError = (e) => {
                        clearTimeout(timeout);
                        this.audio.removeEventListener('canplay', onCanPlay);
                        this.audio.removeEventListener('error', onError);
                        reject(e);
                    };

                    this.audio.addEventListener('canplay', onCanPlay, { once: true });
                    this.audio.addEventListener('error', onError, { once: true });
                });
            }

            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();

        } catch (error) {
            console.error('❌ Erreur de lecture:', error);
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    previousSong() {
        clearTimeout(this.loadTimeout);
        if (this.isShuffled) {
            this.currentSongIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        }
        this.loadCurrentSong();
        if (this.isPlaying) {
            setTimeout(() => this.play(), 200);
        }
    }

    nextSong() {
        clearTimeout(this.loadTimeout);
        if (this.isShuffled) {
            this.currentSongIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        }
        this.loadCurrentSong();
        if (this.isPlaying) {
            setTimeout(() => this.play(), 200);
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn?.classList.toggle('active', this.isShuffled);
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.musicPlayer?.classList.toggle('minimized', this.isMinimized);

        const icon = this.minimizeBtn?.querySelector('i');
        if (icon) {
            icon.className = this.isMinimized ? 'fas fa-plus' : 'fas fa-minus';
        }
    }

    setProgress(e) {
        if (!this.audio.duration) return;

        const width = this.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume / 100));
        if (this.volumeSlider) {
            this.volumeSlider.value = volume;
        }
        this.updateVolumeIcon(volume);
    }

    toggleMute() {
        if (this.audio.volume === 0) {
            this.setVolume(30);
        } else {
            this.setVolume(0);
        }
    }

    updateVolumeIcon(volume) {
        if (!this.volumeIcon) return;

        if (volume === 0) {
            this.volumeIcon.className = 'fas fa-volume-mute volume-icon';
        } else if (volume < 50) {
            this.volumeIcon.className = 'fas fa-volume-down volume-icon';
        } else {
            this.volumeIcon.className = 'fas fa-volume-up volume-icon';
        }
    }

    updatePlayButton() {
        if (!this.playPauseBtn) return;

        const icon = this.playPauseBtn.querySelector('i');
        if (icon) {
            if (this.isPlaying) {
                icon.className = 'fas fa-pause';
                this.equalizer?.classList.remove('paused');
            } else {
                icon.className = 'fas fa-play';
                this.equalizer?.classList.add('paused');
            }
        }
    }

    updatePlayState(playing) {
        this.isPlaying = playing;
        this.updatePlayButton();
    }

    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (duration && this.progressBar && this.currentTimeEl) {
            const progressPercent = (currentTime / duration) * 100;
            this.progressBar.style.width = `${progressPercent}%`;
            this.currentTimeEl.textContent = this.formatTime(currentTime);
        }
    }

    updateTotalTime() {
        if (this.audio.duration && this.totalTimeEl) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSong();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSong();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(100, this.audio.volume * 100 + 10));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.audio.volume * 100 - 10));
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                this.toggleMute();
                break;
            case 's':
            case 'S':
                e.preventDefault();
                this.toggleShuffle();
                break;
        }
    }

    showNotification(message) { /* notifications désactivées */ }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Initialisation du lecteur de musique...');

    try {
        const player = new MusicPlayer();
        window.musicPlayer = player;
        console.log('✅ Lecteur initialisé');

        // Debug: afficher les chemins dans la console
        console.log('📁 Playlist configurée:');
        player.playlist.forEach((song, index) => {
            console.log(`${index + 1}. ${song.title} -> ${song.src}`);
        });

    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
    }
});

