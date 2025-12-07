/**
 * ============================================
 * LECTEUR DE MUSIQUE GLOBAL
 * ============================================
 * 
 * Ce fichier gère le lecteur audio qui apparaît sur toutes les pages du site.
 * Il permet de jouer de la musique en continu même quand on change de page.
 * 
 * Fonctionnalités :
 * - Lecture, pause, précédent, suivant
 * - Répétition d'une chanson (loop)
 * - Contrôle du volume
 * - Barre de progression cliquable et déplaçable
 * - Mode minimisé/agrandi
 * - Sauvegarde automatique de l'état (chanson, position, volume, etc.)
 */

// Classe principale du lecteur de musique
class MusicPlayer {
    // Constructeur : fonction appelée quand on crée un nouveau lecteur
    constructor() {
        // On initialise toutes les variables qui vont stocker les éléments de la page
        // Au début, elles sont toutes vides (null) car les éléments n'existent pas encore
        this.audio = null;                    // L'élément audio HTML qui joue la musique
        this.playPauseBtn = null;              // Le bouton play/pause
        this.prevBtn = null;                  // Le bouton précédent
        this.nextBtn = null;                  // Le bouton suivant
        this.loopBtn = null;                  // Le bouton de répétition
        this.loopIndicator = null;            // Le petit "1" qui apparaît sur le bouton loop
        this.progressContainer = null;         // Le conteneur de la barre de progression
        this.progressBar = null;              // La barre de progression elle-même
        this.currentTimeEl = null;            // L'élément qui affiche le temps actuel (ex: "1:23")
        this.totalTimeEl = null;              // L'élément qui affiche la durée totale (ex: "3:45")
        this.volumeSlider = null;             // Le curseur de volume
        this.volumeIcon = null;               // L'icône du volume (haut, bas, muet)
        this.songTitle = null;                // L'élément qui affiche le titre de la chanson
        this.songArtist = null;               // L'élément qui affiche le nom de l'artiste
        this.minimizeBtn = null;              // Le bouton pour minimiser/agrandir
        this.musicPlayer = null;              // Le conteneur principal du lecteur
        this.equalizer = null;                // L'animation d'égaliseur qui bouge avec la musique

        // Variables qui stockent l'état actuel du lecteur
        this.isPlaying = false;                // Est-ce que la musique est en train de jouer ?
        this.currentSongIndex = 0;            // Index de la chanson actuelle dans la playlist (0 = première)
        this.isLooping = false;               // Est-ce que la répétition est activée ?
        this.isMinimized = false;             // Est-ce que le lecteur est minimisé ?
        this.eventListenersAttached = false;   // Est-ce que les événements sont déjà attachés ?
        this.isDragging = false;              // Est-ce qu'on est en train de déplacer la barre de progression ?

        // La playlist : liste de toutes les chansons disponibles
        this.playlist = [
            {
                title: "Nightcall",           // Titre de la chanson
                artist: "Kavinsky",           // Nom de l'artiste
                src: "./assets/music/nightcall.mp3"  // Chemin vers le fichier audio
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

        // Maintenant qu'on a défini toutes les variables, on initialise le lecteur
        this.initializeDOM();  // On récupère tous les éléments de la page
        
        // On s'assure que l'audio ne se répète pas automatiquement
        // (on gère la répétition nous-mêmes avec le bouton loop)
        if (this.audio) {
            this.audio.loop = false;
        }
        
        // On lance l'initialisation complète
        this.init();
    }

    /**
     * Cette fonction récupère tous les éléments HTML de la page
     * et les stocke dans les variables pour pouvoir les utiliser
     */
    initializeDOM() {
        // On utilise getElementById pour trouver chaque élément par son ID
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.loopBtn = document.getElementById('loopBtn');
        this.loopIndicator = document.getElementById('loopIndicator');
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
    }

    /**
     * Cette fonction réinitialise les références aux éléments HTML
     * Utile quand on change de page et que les éléments sont recréés
     */
    reinitializeDOM() {
        // On récupère à nouveau tous les éléments
        this.initializeDOM();
        
        // Si les événements ne sont pas encore attachés, on les attache
        if (this.audio && !this.eventListenersAttached) {
            this.setupEventListeners();           // Événements des boutons
            this.setupAudioEventListeners();      // Événements de l'audio
            this.eventListenersAttached = true;
            
            // On restaure l'apparence visuelle (boutons actifs, etc.)
            this.restoreVisualState();
        }
    }

    /**
     * Fonction principale d'initialisation
     * Elle configure tout ce qui est nécessaire pour que le lecteur fonctionne
     */
    init() {
        // Si l'élément audio n'existe pas encore, on attend un peu et on réessaie
        // (ça peut arriver si le lecteur est injecté dynamiquement)
        if (!this.audio) {
            setTimeout(() => {
                this.initializeDOM();
                if (this.audio) {
                    this.init();
                }
            }, 100);
            return;
        }

        // On attache les événements seulement s'ils ne sont pas déjà attachés
        // (pour éviter de les attacher plusieurs fois)
        if (!this.eventListenersAttached) {
            this.setupEventListeners();           // Écouter les clics sur les boutons
            this.setupAudioEventListeners();      // Écouter les événements de l'audio
            this.eventListenersAttached = true;
        }

        // On restaure l'état précédent (chanson, volume, etc.)
        // si l'utilisateur avait déjà utilisé le lecteur
        this.restoreState();

        // On sauvegarde l'état juste avant que l'utilisateur quitte la page
        window.addEventListener('beforeunload', () => this.saveState());
        
        // On sauvegarde aussi automatiquement toutes les 2 secondes
        // pour ne pas perdre l'état si la page se ferme brutalement
        setInterval(() => this.saveState(), 2000);
    }

    /**
     * Sauvegarde l'état actuel du lecteur dans la mémoire du navigateur
     * Cela permet de restaurer l'état quand on revient sur le site
     */
    saveState() {
        // Si l'audio n'existe pas, on ne peut rien sauvegarder
        if (!this.audio) return;
        
        // On crée un objet qui contient toutes les informations importantes
        const state = {
            currentSongIndex: this.currentSongIndex,      // Quelle chanson est en cours
            currentTime: this.audio.currentTime || 0,    // À quel moment de la chanson on est
            isPlaying: !this.audio.paused,                // Est-ce que ça joue ?
            volume: this.audio.volume || 0.3,            // Le volume (entre 0 et 1)
            isLooping: this.isLooping,                    // Répétition activée ?
            isMinimized: this.isMinimized                 // Lecteur minimisé ?
        };
        
        // On convertit l'objet en texte (JSON) et on le stocke dans localStorage
        // localStorage est une mémoire du navigateur qui persiste même après fermeture
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    /**
     * Restaure l'état précédent du lecteur depuis localStorage
     * Si l'utilisateur avait une chanson en cours, elle reprend là où elle s'était arrêtée
     */
    restoreState() {
        if (!this.audio) return;
        
        // On récupère l'état sauvegardé
        const savedState = localStorage.getItem('musicPlayerState');
        
        // Si un état a été sauvegardé
        if (savedState) {
            try {
                // On convertit le texte JSON en objet JavaScript
                const state = JSON.parse(savedState);
                
                // On vérifie que l'index de la chanson est valide
                // (il doit être entre 0 et le nombre de chansons)
                let savedIndex = state.currentSongIndex;
                if (savedIndex === undefined || savedIndex === null || 
                    savedIndex < 0 || savedIndex >= this.playlist.length) {
                    savedIndex = 0;  // Si l'index n'est pas valide, on prend la première chanson
                }
                
                // On restaure la dernière chanson jouée pour continuer la musique sur les autres pages
                
                // On restaure toutes les variables
                this.currentSongIndex = savedIndex;
                this.isLooping = state.isLooping || false;
                this.isMinimized = false;  // Toujours démarrer en mode agrandi
                
                // On charge la chanson (mais on ne la joue pas encore)
                this.loadCurrentSong(false);

                // On restaure le volume
                if (state.volume !== undefined) {
                    this.setVolume(state.volume * 100);  // Le volume est entre 0 et 100
                } else {
                    this.setVolume(30);  // Volume par défaut : 30%
                }

                // On restaure la position dans la chanson
                // On doit attendre que le fichier soit chargé pour ça
                this.audio.addEventListener('loadedmetadata', () => {
                    if (state.currentTime !== undefined) {
                        this.audio.currentTime = state.currentTime || 0;
                    }
                }, { once: true });  // once: true = on écoute seulement une fois

                // On restaure l'apparence (boutons actifs, etc.)
                this.restoreVisualState();

                // On met à jour l'état du bouton play et de l'égaliseur selon l'état sauvegardé
                this.isPlaying = state.isPlaying || false;
                this.updatePlayButton();

                // Si la musique était en train de jouer, on essaie de la relancer
                if (state.isPlaying) {
                    // Les navigateurs bloquent parfois l'autoplay (pour éviter les pubs bruyantes)
                    // On essaie quand même, mais ça peut échouer
                    const playPromise = this.audio.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            // Ça a marché, la musique joue
                            this.isPlaying = true;
                            this.updatePlayButton();
                        }).catch(error => {
                            // Ça a échoué, c'est normal, l'utilisateur devra cliquer sur play
                            console.log("Autoplay bloqué par le navigateur", error);
                            this.isPlaying = false;
                            this.updatePlayButton();
                        });
                    }
                }
            } catch (e) {
                // Si quelque chose a mal tourné, on initialise avec les valeurs par défaut
                console.error('Erreur lors de la restauration de l\'état:', e);
                this.currentSongIndex = 0;
                this.loadCurrentSong(false);
                this.setVolume(30);
                // On s'assure que l'égaliseur est désactivé
                this.isPlaying = false;
                this.updatePlayButton();
            }
        } else {
            // C'est la première fois qu'on charge le site
            // On commence par la première chanson
            this.currentSongIndex = 0;
            this.loadCurrentSong(false);
            this.setVolume(30);
            // On s'assure que l'égaliseur est désactivé au démarrage
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    /**
     * Restaure l'apparence visuelle du lecteur
     * (boutons actifs, lecteur minimisé, etc.)
     */
    restoreVisualState() {
        // Si le lecteur était minimisé, on remet la classe CSS
        if (this.isMinimized && this.musicPlayer) {
            this.musicPlayer.classList.add('minimized');
            // On change l'icône du bouton minimiser en "plus" (pour agrandir)
            if (this.minimizeBtn?.querySelector('i')) {
                this.minimizeBtn.querySelector('i').className = 'fas fa-plus';
            }
        }

        // On met à jour l'apparence du bouton loop
        this.updateLoopButton();
    }

    /**
     * Charge une chanson dans le lecteur
     * @param {boolean} autoPlay - Si true, la chanson démarre automatiquement
     */
    loadCurrentSong(autoPlay = false) {
        // On vérifie que la chanson existe dans la playlist
        if (!this.playlist[this.currentSongIndex]) return;

        // On récupère les infos de la chanson actuelle
        const currentSong = this.playlist[this.currentSongIndex];
        
        // On s'assure que la répétition automatique est désactivée
        // (on gère ça nous-mêmes avec le bouton loop)
        this.audio.loop = false;
        
        // On change la source audio seulement si c'est une nouvelle chanson
        // (pour éviter de recharger inutilement le fichier)
        if (this.audio.src.indexOf(currentSong.src.replace('./', '')) === -1) {
            this.audio.src = currentSong.src;
        }
        
        // On met à jour l'affichage du titre et de l'artiste
        this.songTitle.textContent = currentSong.title;
        this.songArtist.textContent = currentSong.artist;

        // Si autoPlay est true, on démarre la lecture
        if (autoPlay) {
            this.play();
        }
    }

    /**
     * Attache tous les événements aux boutons et éléments du lecteur
     * Quand on clique sur un bouton, ça appelle la fonction correspondante
     */
    setupEventListeners() {
        // Si des événements sont déjà attachés, on les retire d'abord
        // (pour éviter de les attacher plusieurs fois)
        if (this._eventListeners) {
            this.removeEventListeners();
        }
        
        // On crée un objet qui contient toutes les fonctions à appeler
        // quand on clique sur les différents éléments
        this._eventListeners = {
            playPause: () => this.togglePlayPause(),              // Clic sur play/pause
            prev: () => this.previousSong(),                      // Clic sur précédent
            next: () => this.nextSong(),                          // Clic sur suivant
            loop: () => this.toggleLoop(),                        // Clic sur loop
            minimize: () => this.toggleMinimize(),                // Clic sur minimiser
            progress: (e) => this.setProgress(e),                  // Clic sur la barre de progression
            progressMouseDown: (e) => this.handleProgressMouseDown(e),  // Début du drag
            progressMouseMove: (e) => this.handleProgressMouseMove(e),  // Pendant le drag
            progressMouseUp: () => this.handleProgressMouseUp(),        // Fin du drag
            volume: (e) => this.setVolume(e.target.value),       // Changement du volume
            mute: () => this.toggleMute()                         // Clic sur l'icône volume
        };

        // On attache chaque événement à son élément
        // Le ?. signifie "si l'élément existe, alors..."
        this.playPauseBtn?.addEventListener('click', this._eventListeners.playPause);
        this.prevBtn?.addEventListener('click', this._eventListeners.prev);
        this.nextBtn?.addEventListener('click', this._eventListeners.next);
        this.loopBtn?.addEventListener('click', this._eventListeners.loop);
        this.minimizeBtn?.addEventListener('click', this._eventListeners.minimize);
        
        // Pour la barre de progression, on gère le clic et le drag
        this.progressContainer?.addEventListener('mousedown', this._eventListeners.progressMouseDown);
        this.progressContainer?.addEventListener('click', this._eventListeners.progress);
        
        // Pour le volume
        this.volumeSlider?.addEventListener('input', this._eventListeners.volume);
        this.volumeIcon?.addEventListener('click', this._eventListeners.mute);
    }

    /**
     * Retire tous les événements attachés
     * Utile pour éviter les doublons quand on réinitialise
     */
    removeEventListeners() {
        if (!this._eventListeners) return;
        
        // On retire chaque événement
        this.playPauseBtn?.removeEventListener('click', this._eventListeners.playPause);
        this.prevBtn?.removeEventListener('click', this._eventListeners.prev);
        this.nextBtn?.removeEventListener('click', this._eventListeners.next);
        this.loopBtn?.removeEventListener('click', this._eventListeners.loop);
        this.minimizeBtn?.removeEventListener('click', this._eventListeners.minimize);
        this.progressContainer?.removeEventListener('mousedown', this._eventListeners.progressMouseDown);
        this.progressContainer?.removeEventListener('click', this._eventListeners.progress);
        
        // On retire aussi les événements globaux (pour le drag)
        document.removeEventListener('mousemove', this._eventListeners.progressMouseMove);
        document.removeEventListener('mouseup', this._eventListeners.progressMouseUp);
        
        this.volumeSlider?.removeEventListener('input', this._eventListeners.volume);
        this.volumeIcon?.removeEventListener('click', this._eventListeners.mute);
    }

    /**
     * Attache les événements liés à l'élément audio lui-même
     * (quand la musique joue, s'arrête, avance, etc.)
     */
    setupAudioEventListeners() {
        // Si des événements sont déjà attachés, on les retire d'abord
        if (this._audioEventListeners) {
            this.removeAudioEventListeners();
        }

        // On crée les fonctions à appeler pour chaque événement audio
        this._audioEventListeners = {
            timeupdate: () => this.updateProgress(),        // Appelé régulièrement pendant la lecture
            ended: () => this.handleSongEnded(),            // Appelé quand la chanson se termine
            play: () => {                                    // Appelé quand la musique démarre
                this.isPlaying = true; 
                this.updatePlayButton();
                this.saveState();  // On sauvegarde l'état
            },
            pause: () => {                                   // Appelé quand la musique s'arrête
                this.isPlaying = false; 
                this.updatePlayButton();
                this.saveState();  // On sauvegarde l'état
            }
        };

        // On attache chaque événement
        this.audio.addEventListener('timeupdate', this._audioEventListeners.timeupdate);
        this.audio.addEventListener('ended', this._audioEventListeners.ended);
        this.audio.addEventListener('play', this._audioEventListeners.play);
        this.audio.addEventListener('pause', this._audioEventListeners.pause);
    }

    /**
     * Retire tous les événements audio attachés
     */
    removeAudioEventListeners() {
        if (!this.audio || !this._audioEventListeners) return;
        
        this.audio.removeEventListener('timeupdate', this._audioEventListeners.timeupdate);
        this.audio.removeEventListener('ended', this._audioEventListeners.ended);
        this.audio.removeEventListener('play', this._audioEventListeners.play);
        this.audio.removeEventListener('pause', this._audioEventListeners.pause);
    }

    /**
     * Bascule entre play et pause
     * Si la musique joue, on la met en pause
     * Si elle est en pause, on la lance
     */
    togglePlayPause() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    /**
     * Lance la lecture de la musique
     */
    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
        }).catch(e => console.error("Erreur lecture", e));
    }

    /**
     * Met la musique en pause
     */
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    /**
     * Passe à la chanson précédente
     * Si on est à la première, on va à la dernière (boucle)
     */
    previousSong() {
        // Le % permet de faire une boucle : si on est à 0 et qu'on fait -1,
        // on arrive à la dernière chanson de la playlist
        this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadCurrentSong(true);  // On charge et on joue automatiquement
        this.saveState();
    }

    /**
     * Passe à la chanson suivante
     * Si on est à la dernière, on revient à la première (boucle)
     */
    nextSong() {
        // Le % permet de faire une boucle : si on est à la dernière et qu'on fait +1,
        // on revient à la première chanson
        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.loadCurrentSong(true);  // On charge et on joue automatiquement
        this.saveState();
    }

    /**
     * Gère ce qui se passe quand une chanson se termine
     */
    handleSongEnded() {
        if (this.isLooping) {
            // Si la répétition est activée, on remet la chanson au début et on la relance
            this.audio.currentTime = 0;
            // On utilise setTimeout car certains navigateurs bloquent l'autoplay
            setTimeout(() => {
                this.play().catch(e => {
                    console.log("Autoplay bloqué, l'utilisateur devra cliquer sur play");
                });
            }, 100);
        } else {
            // Si la répétition n'est pas activée
            if (this.currentSongIndex < this.playlist.length - 1) {
                // S'il reste des chansons, on passe à la suivante
                this.nextSong();
            } else {
                // Si c'était la dernière chanson, on s'arrête
                this.pause();
                this.audio.currentTime = 0;  // On remet au début
            }
        }
    }

    /**
     * Active ou désactive la répétition de la chanson actuelle
     */
    toggleLoop() {
        // On inverse l'état : si c'était activé, ça devient désactivé, et vice versa
        this.isLooping = !this.isLooping;
        this.updateLoopButton();  // On met à jour l'apparence du bouton
        this.saveState();
    }

    /**
     * Met à jour l'apparence du bouton de répétition
     * Quand il est activé, il devient coloré
     */
    updateLoopButton() {
        if (!this.loopBtn) return;
        
        // On récupère l'icône et l'indicateur "1"
        const icon = this.loopBtn.querySelector('i');
        const indicator = this.loopIndicator;
        
        // On retire toutes les classes actives
        this.loopBtn.classList.remove('active', 'loop-one', 'loop-all');
        
        if (this.isLooping) {
            // Si la répétition est activée, on met le bouton en couleur
            if (icon) icon.className = 'fas fa-repeat';
            this.loopBtn.classList.add('active', 'loop-all');
            if (indicator) indicator.style.display = 'none';
        } else {
            // Si la répétition n'est pas activée, le bouton est normal
            if (icon) icon.className = 'fas fa-repeat';
            if (indicator) indicator.style.display = 'none';
        }
    }

    /**
     * Minimise ou agrandit le lecteur
     * En mode minimisé, seul le titre et l'artiste sont visibles
     */
    toggleMinimize() {
        // On inverse l'état minimisé
        this.isMinimized = !this.isMinimized;
        
        // On ajoute ou retire la classe CSS "minimized"
        this.musicPlayer?.classList.toggle('minimized', this.isMinimized);
        
        // On change l'icône : plus (+) si minimisé, moins (-) si agrandi
        const icon = this.minimizeBtn?.querySelector('i');
        if (icon) icon.className = this.isMinimized ? 'fas fa-plus' : 'fas fa-minus';
        
        this.saveState();
    }

    /**
     * Change la position dans la chanson quand on clique sur la barre de progression
     * @param {Event} e - L'événement de clic (contient la position de la souris)
     */
    setProgress(e) {
        if (!this.progressContainer || !this.audio) return;
        
        // On calcule la largeur de la barre de progression
        const width = this.progressContainer.clientWidth;
        
        // On calcule où on a cliqué (par rapport au début de la barre)
        const rect = this.progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // On récupère la durée totale de la chanson
        const duration = this.audio.duration;
        
        // Si la durée est valide, on calcule le nouveau temps
        if (duration && !isNaN(duration)) {
            // On calcule le pourcentage de progression
            // Puis on le convertit en secondes
            const newTime = Math.max(0, Math.min((clickX / width) * duration, duration));
            this.audio.currentTime = newTime;
            this.saveState();
        }
    }

    /**
     * Gère le début du drag sur la barre de progression
     * Quand on maintient le clic et qu'on déplace la souris
     */
    handleProgressMouseDown(e) {
        if (!this.progressContainer || !this.progressBar) return;
        
        // On indique qu'on est en train de déplacer
        this.isDragging = true;
        
        // On désactive la transition CSS pendant le drag
        // pour que la barre suive la souris instantanément
        if (this.progressBar) {
            this.progressBar.style.transition = 'none';
        }
        
        // On met à jour la position
        this.setProgress(e);
        
        // On attache des événements globaux pour suivre le mouvement de la souris
        // même si elle sort de la barre de progression
        document.addEventListener('mousemove', this._eventListeners.progressMouseMove);
        document.addEventListener('mouseup', this._eventListeners.progressMouseUp);
        
        // On empêche la sélection de texte pendant le drag
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Gère le mouvement de la souris pendant le drag
     */
    handleProgressMouseMove(e) {
        // Si on n'est pas en train de déplacer, on ne fait rien
        if (!this.isDragging || !this.progressContainer) return;
        
        // On met à jour la position en continu
        this.setProgress(e);
    }

    /**
     * Gère la fin du drag (quand on relâche le clic)
     */
    handleProgressMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            
            // On réactive la transition CSS
            if (this.progressBar) {
                this.progressBar.style.transition = '';
            }
            
            // On retire les événements globaux
            document.removeEventListener('mousemove', this._eventListeners.progressMouseMove);
            document.removeEventListener('mouseup', this._eventListeners.progressMouseUp);
        }
    }

    /**
     * Change le volume
     * @param {number} volume - Le volume entre 0 et 100
     */
    setVolume(volume) {
        // L'élément audio utilise un volume entre 0 et 1, donc on divise par 100
        this.audio.volume = volume / 100;
        
        // On met à jour le curseur de volume
        if (this.volumeSlider) this.volumeSlider.value = volume;
        
        // On met à jour l'icône (haut, bas, ou muet)
        this.updateVolumeIcon(volume);
    }

    /**
     * Active ou désactive le son (mute/unmute)
     */
    toggleMute() {
        // Si le volume est à 0, on le remet à 30
        // Sinon, on le met à 0
        if (this.audio.volume === 0) this.setVolume(30);
        else this.setVolume(0);
    }

    /**
     * Met à jour l'icône du volume selon le niveau
     * @param {number} volume - Le volume entre 0 et 100
     */
    updateVolumeIcon(volume) {
        if (!this.volumeIcon) return;
        
        // On change l'icône selon le volume
        if (volume == 0) {
            this.volumeIcon.className = 'fas fa-volume-mute volume-icon';  // Muet
        } else if (volume < 50) {
            this.volumeIcon.className = 'fas fa-volume-down volume-icon';  // Bas
        } else {
            this.volumeIcon.className = 'fas fa-volume-up volume-icon';    // Haut
        }
    }

    /**
     * Met à jour l'apparence du bouton play/pause
     * Change l'icône entre play (▶) et pause (⏸)
     */
    updatePlayButton() {
        if (!this.playPauseBtn) return;
        
        // On récupère l'icône dans le bouton
        const icon = this.playPauseBtn.querySelector('i');
        if (icon) {
            // On change l'icône selon si la musique joue ou non
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
        
        // On gère aussi l'animation de l'égaliseur
        if (this.equalizer) {
            if (this.isPlaying) {
                this.equalizer.classList.remove('paused');  // L'animation joue
            } else {
                this.equalizer.classList.add('paused');     // L'animation s'arrête
            }
        }
    }

    /**
     * Met à jour l'affichage de la barre de progression et des temps
     * Cette fonction est appelée régulièrement pendant la lecture
     */
    updateProgress() {
        const { currentTime, duration } = this.audio;
        
        // Si la durée n'est pas encore chargée, on ne fait rien
        if(isNaN(duration)) return;
        
        // On calcule le pourcentage de progression
        const progressPercent = (currentTime / duration) * 100;
        
        // On met à jour la largeur de la barre de progression
        this.progressBar.style.width = `${progressPercent}%`;
        
        // On formate le temps actuel en minutes:secondes
        let mins = Math.floor(currentTime / 60);
        let secs = Math.floor(currentTime % 60);
        if (secs < 10) secs = `0${secs}`;  // On ajoute un 0 devant si nécessaire (ex: "05" au lieu de "5")
        this.currentTimeEl.textContent = `${mins}:${secs}`;

        // On formate la durée totale en minutes:secondes
        let totalMins = Math.floor(duration / 60);
        let totalSecs = Math.floor(duration % 60);
        if (totalSecs < 10) totalSecs = `0${totalSecs}`;
        this.totalTimeEl.textContent = `${totalMins}:${totalSecs}`;
    }
}

/**
 * Code qui s'exécute automatiquement au chargement de la page
 * Il crée une seule instance du lecteur (pattern Singleton)
 * Cela garantit qu'il n'y a qu'un seul lecteur, même si on change de page
 */
(function() {
    'use strict';
    
    // Si le lecteur n'existe pas encore, on en crée un nouveau
    if (!window.musicPlayerInstance) {
        // On attend que la page soit complètement chargée
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.musicPlayerInstance = new MusicPlayer();
            });
        } else {
            // Si la page est déjà chargée, on crée le lecteur tout de suite
            window.musicPlayerInstance = new MusicPlayer();
        }
    } else {
        // Si le lecteur existe déjà (par exemple après un changement de page),
        // on réinitialise juste les références aux éléments HTML
        window.musicPlayerInstance.reinitializeDOM();
    }
    
    // On crée aussi un alias pour compatibilité
    window.musicPlayer = window.musicPlayerInstance;
})();
