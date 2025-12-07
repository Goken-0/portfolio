/**
 * ============================================
 * ANIMATION DES ÉTOILES 3D EN ARRIÈRE-PLAN
 * ============================================
 * 
 * Ce fichier crée un fond animé avec des étoiles en 3D pour la page d'accueil.
 * Il utilise la bibliothèque Three.js pour le rendu 3D.
 * 
 * Fonctionnalités :
 * - 15000 étoiles fixes qui scintillent
 * - Étoiles filantes occasionnelles avec traînées lumineuses
 * - Pluie d'étoiles filantes aléatoire
 * - Animation fluide et performante
 * 
 * Technologies :
 * - Three.js : Bibliothèque JavaScript 3D
 * - WebGL : Rendu graphique accéléré par le GPU
 */

// ============================================
// CONFIGURATION DE BASE THREE.JS
// ============================================

// Créer la scène 3D (l'environnement où tout se passe)
const scene = new THREE.Scene();

// Créer la caméra (le point de vue)
// PerspectiveCamera(angle de vue, ratio largeur/hauteur, distance min, distance max)
const camera = new THREE.PerspectiveCamera(
    75,                                    // Angle de vue (en degrés)
    window.innerWidth / window.innerHeight, // Ratio d'aspect (largeur/hauteur)
    0.1,                                   // Distance minimale visible
    1000                                    // Distance maximale visible
);

// Créer le moteur de rendu (qui dessine tout sur l'écran)
const renderer = new THREE.WebGLRenderer({ antialias: true });  // antialias = lissage des bords
renderer.setSize(window.innerWidth, window.innerHeight);        // Taille du rendu = taille de la fenêtre

// Ajouter le canvas au body et lui donner la classe "background"
renderer.domElement.classList.add("background");
document.body.appendChild(renderer.domElement);

// ============================================
// CRÉATION DES ÉTOILES FIXES
// ============================================

// Créer la géométrie pour les étoiles (structure de données)
const starGeometry = new THREE.BufferGeometry();
const starCount = 15000;  // Nombre d'étoiles

// Tableaux pour stocker les positions (x, y, z pour chaque étoile)
const starPositions = new Float32Array(starCount * 3);  // *3 car x, y, z
const starSizes = new Float32Array(starCount);           // Taille de chaque étoile

// Remplir les tableaux avec des positions aléatoires
for (let i = 0; i < starCount * 3; i += 3) {
    // Position X aléatoire entre -1500 et 1500
    starPositions[i] = (Math.random() - 0.5) * 3000;
    // Position Y aléatoire entre -1500 et 1500
    starPositions[i + 1] = (Math.random() - 0.5) * 3000;
    // Position Z aléatoire entre -1500 et 1500
    starPositions[i + 2] = (Math.random() - 0.5) * 3000;
    // Taille aléatoire entre 1 et 4
    starSizes[i / 3] = Math.random() * 3 + 1;
}

// Attacher les données à la géométrie
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

// Stocker les tailles originales pour l'animation (une seule fois)
const originalSizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
    originalSizes[i] = starSizes[i];
}

// Créer le matériau des étoiles (apparence)
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,          // Couleur blanche
    size: 1.5,                 // Taille de base
    transparent: true,         // Permet la transparence
    opacity: 1.0,              // Opacité complète
    sizeAttenuation: false     // Les étoiles gardent la même taille peu importe la distance
});

// Créer l'objet Points qui contient toutes les étoiles
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);  // Ajouter à la scène

// Positionner la caméra (reculer pour voir les étoiles)
camera.position.z = 800;

// ============================================
// CRÉATION DES ÉTOILES FILANTES
// ============================================

// Tableau qui stocke toutes les étoiles filantes actives
let shootingStars = [];

// Couleurs possibles pour les étoiles filantes
const colors = [0xffffff, 0xffffaa, 0xaaffff, 0xffaaff, 0xaaffaa];

/**
 * Crée une nouvelle étoile filante avec traînée lumineuse
 */
function createShootingStar() {
    // Noyau lumineux (la partie principale de l'étoile)
    const coreGeometry = new THREE.SphereGeometry(2, 16, 16);  // Sphère de rayon 2 (réduit encore)
    const coreColor = colors[Math.floor(Math.random() * colors.length)];  // Couleur aléatoire
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    
    // Halo extérieur (effet de lueur autour du noyau)
    const haloGeometry = new THREE.SphereGeometry(4, 16, 16);  // Plus grand que le noyau (réduit à 4)
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 0.3  // Semi-transparent
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    
    // Position initiale aléatoire
    const startX = Math.random() > 0.5 ? 1500 : -1500;  // Soit à gauche, soit à droite
    const startY = Math.random() * 1000 + 500;          // Entre 500 et 1500 en hauteur
    // Limiter la profondeur Z pour éviter que les étoiles soient trop proches de la caméra (z=800)
    // Garder les étoiles entre 200 et 600 devant la caméra pour une taille raisonnable
    const startZ = 800 - (Math.random() * 400 + 200);  // Entre 200 et 600 devant la caméra
    
    core.position.set(startX, startY, startZ);
    halo.position.copy(core.position);  // Le halo suit le noyau
    
    // Vitesse de déplacement (diagonale avec variation) - réduite pour un mouvement plus fluide
    const velocity = new THREE.Vector3(
        startX > 0 ? -(Math.random() * 4 + 5) : (Math.random() * 4 + 5),  // Vers le centre (réduit)
        -(Math.random() * 5 + 4),  // Vers le bas (réduit)
        (Math.random() - 0.5) * 1   // Légère variation en profondeur (réduit)
    );
    
    // Créer plusieurs traînées lumineuses (effet de queue)
    const trails = [];
    const trailCount = 3;      // Nombre de traînées (réduit de 5 à 3)
    const trailLength = 200;   // Longueur de chaque traînée (réduit de 300 à 200)
    
    for (let i = 0; i < trailCount; i++) {
        const trailGeometry = new THREE.BufferGeometry();
        const trailPoints = [];
        const segmentCount = 50;  // Nombre de points dans la traînée
        
        // Créer les points de la traînée (derrière l'étoile)
        for (let j = 0; j < segmentCount; j++) {
            const progress = j / (segmentCount - 1);  // Progression de 0 à 1
            // Position du point = position de l'étoile - direction * longueur * progression
            const trailPos = core.position.clone().add(
                velocity.clone().normalize().multiplyScalar(-trailLength * progress)
            );
            trailPoints.push(trailPos);
        }
        
        trailGeometry.setFromPoints(trailPoints);
        
        // Matériau de la traînée (opacité qui diminue)
        const trailMaterial = new THREE.LineBasicMaterial({
            color: coreColor,
            transparent: true,
            opacity: 0.8 - (i * 0.15),  // Plus la traînée est loin, plus elle est transparente
            linewidth: 3 - (i * 0.5)
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trails.push(trail);
        scene.add(trail);
    }
    
    // Particules sparkles (petites particules qui brillent autour)
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparkleCount = 15;  // Réduit de 20 à 15
    const sparklePositions = new Float32Array(sparkleCount * 3);
    
    // Positionner les particules autour du noyau (zone plus petite)
    for (let i = 0; i < sparkleCount * 3; i += 3) {
        sparklePositions[i] = core.position.x + (Math.random() - 0.5) * 30;  // Réduit de 50 à 30
        sparklePositions[i + 1] = core.position.y + (Math.random() - 0.5) * 30;
        sparklePositions[i + 2] = core.position.z + (Math.random() - 0.5) * 30;
    }
    
    sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
    
    const sparkleMaterial = new THREE.PointsMaterial({
        color: coreColor,
        size: 1.5,  // Réduit encore à 1.5 pour des particules plus petites
        transparent: true,
        opacity: 0.8
    });
    
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    
    // Grouper tous les éléments de l'étoile filante
    const shootingStarGroup = {
        core,           // Noyau
        halo,           // Halo
        trails,         // Traînées
        sparkles,       // Particules
        velocity,       // Vitesse
        life: 1.0,      // Durée de vie (1.0 = 100%)
        maxLife: Math.random() * 3 + 4  // Durée de vie maximale (en secondes)
    };
    
    // Ajouter à la scène
    scene.add(core);
    scene.add(halo);
    scene.add(sparkles);
    shootingStars.push(shootingStarGroup);
    
    // Nettoyage automatique après la durée de vie
    setTimeout(() => {
        scene.remove(core);
        scene.remove(halo);
        scene.remove(sparkles);
        trails.forEach(trail => scene.remove(trail));
        shootingStars = shootingStars.filter(s => s.core !== core);
    }, shootingStarGroup.maxLife * 1000);
}

// Générer une étoile filante toutes les 2 secondes (80% de chance)
setInterval(() => {
    if (Math.random() < 0.8) {
        createShootingStar();
    }
}, 2000);

// Événement spécial : pluie d'étoiles filantes (30% de chance toutes les 15 secondes)
setInterval(() => {
    if (Math.random() < 0.30) {
        console.log("🌟 Pluie d'étoiles filantes !");
        // Créer 5 étoiles filantes avec un léger décalage (réduit de 8 à 5)
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createShootingStar(), i * 250);  // Délai augmenté de 200 à 250ms
        }
    }
}, 15000);

// ============================================
// BOUCLE D'ANIMATION PRINCIPALE
// ============================================

/**
 * Fonction d'animation appelée en continu
 * Cette fonction met à jour toutes les positions et redessine tout
 */
function animateStars() {
    // Demander la prochaine frame (cela crée une boucle infinie)
    requestAnimationFrame(animateStars);
    
    // Faire tourner les étoiles fixes lentement
    stars.rotation.y += 0.0003;  // Rotation autour de l'axe Y
    stars.rotation.x += 0.0001;   // Rotation autour de l'axe X
    
    // Effet de scintillement des étoiles (changement de taille)
    const time = Date.now() * 0.001;  // Temps en secondes
    const sizes = stars.geometry.attributes.size.array;
    
    for (let i = 0; i < sizes.length; i++) {
        // Utiliser la taille originale stockée au lieu de recalculer avec Math.random()
        const originalSize = originalSizes[i];
        // Utiliser sin pour créer un effet de pulsation (variation plus douce)
        sizes[i] = originalSize + Math.sin(time + i * 0.1) * 0.3;
    }
    stars.geometry.attributes.size.needsUpdate = true;  // Indiquer que les tailles ont changé
    
    // Faire descendre les étoiles (effet de mouvement)
    const positions = stars.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {  // i+1 = position Y
        positions[i] -= 0.02;  // Déplacer vers le bas
        // Si l'étoile sort en bas, la remettre en haut
        if (positions[i] < -1500) positions[i] = 1500;
    }
    stars.geometry.attributes.position.needsUpdate = true;
    
    // Animer les étoiles filantes
    shootingStars.forEach((star, index) => {
        // Déplacer le noyau selon sa vitesse
        star.core.position.add(star.velocity);
        star.halo.position.copy(star.core.position);  // Le halo suit le noyau
        
        // Supprimer l'étoile si elle sort de l'écran (optimisation)
        if (star.core.position.x < -2000 || star.core.position.x > 2000 ||
            star.core.position.y < -2000 || star.core.position.y > 2000 ||
            star.core.position.z < 0 || star.core.position.z > 1000) {
            star.life = 0;  // Forcer la suppression
        }
        
        // Mettre à jour les traînées (elles doivent suivre l'étoile)
        star.trails.forEach((trail, trailIndex) => {
            const trailPoints = [];
            const segmentCount = 50;
            const offset = trailIndex * 10;  // Décalage pour chaque traînée
            
            // Recalculer les points de la traînée
            for (let j = 0; j < segmentCount; j++) {
                const progress = j / (segmentCount - 1);
                const trailPos = star.core.position.clone().add(
                    star.velocity.clone().normalize().multiplyScalar(-(200 + offset) * progress)  // Réduit de 300 à 200
                );
                trailPoints.push(trailPos);
            }
            
            trail.geometry.setFromPoints(trailPoints);
        });
        
        // Mettre à jour les particules sparkles
        const sparklePositions = star.sparkles.geometry.attributes.position.array;
        for (let i = 0; i < sparklePositions.length; i += 3) {
            // Déplacer les particules avec la vitesse de l'étoile + variation aléatoire
            sparklePositions[i] += star.velocity.x * 0.8 + (Math.random() - 0.5) * 2;
            sparklePositions[i + 1] += star.velocity.y * 0.8 + (Math.random() - 0.5) * 2;
            sparklePositions[i + 2] += star.velocity.z * 0.8 + (Math.random() - 0.5) * 2;
        }
        star.sparkles.geometry.attributes.position.needsUpdate = true;
        
        // Diminuer progressivement l'opacité (fade out)
        star.life -= 1 / (star.maxLife * 60);  // Diminuer selon le nombre de frames
        star.core.material.opacity = Math.max(0, star.life);
        star.halo.material.opacity = Math.max(0, star.life * 0.3);
        star.sparkles.material.opacity = Math.max(0, star.life * 0.8);
        
        // Diminuer aussi l'opacité des traînées
        star.trails.forEach((trail, trailIndex) => {
            trail.material.opacity = Math.max(0, (star.life * (0.8 - trailIndex * 0.15)));
        });
    });
    
    // Rendre la scène (dessiner tout sur l'écran)
    renderer.render(scene, camera);
}

// ============================================
// GESTION DU REDIMENSIONNEMENT
// ============================================

// Quand la fenêtre est redimensionnée, adapter le rendu
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;  // Mettre à jour le ratio
    camera.updateProjectionMatrix();  // Recalculer la projection
});

// Démarrer l'animation
animateStars();
