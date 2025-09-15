// Created with love 🩶 by Denvil 🧑‍💻
// NEXUS AI 3D Renderer for enhanced visual experience

export class ThreeRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.logoScene = null;
        this.logoCamera = null;
        this.logoRenderer = null;
        this.animationId = null;
        this.logoAnimationId = null;
        this.particles = [];
        this.logoGeometry = null;
        this.logoMaterial = null;
        this.logoMesh = null;
        
        this.init();
    }

    init() {
        this.createBackgroundScene();
        this.createLogoScene();
        this.createParticles();
        this.createLogo();
        this.animate();
        this.animateLogo();
        this.handleResize();
    }

    createBackgroundScene() {
        // Get canvas element
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;

        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
    }

    createLogoScene() {
        // Get logo canvas element
        const logoCanvas = document.getElementById('logo-canvas');
        if (!logoCanvas) return;

        // Create logo scene
        this.logoScene = new THREE.Scene();
        
        // Create logo camera
        this.logoCamera = new THREE.PerspectiveCamera(
            75,
            80 / 80, // Square aspect ratio for logo
            0.1,
            1000
        );
        this.logoCamera.position.z = 3;

        // Create logo renderer
        this.logoRenderer = new THREE.WebGLRenderer({
            canvas: logoCanvas,
            alpha: true,
            antialias: true
        });
        this.logoRenderer.setSize(80, 80);
        this.logoRenderer.setClearColor(0x000000, 0);
    }

    createParticles() {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = (Math.random() - 0.5) * 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;
            
            // Color (NEXUS AI theme colors)
            const color = new THREE.Color();
            color.setHSL(
                0.6 + Math.random() * 0.2, // Blue to purple hue
                0.8,
                0.5 + Math.random() * 0.3
            );
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Use simple PointsMaterial instead of custom shader
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createLogo() {
        // Create a simple geometric logo for NEXUS AI
        const geometry = new THREE.BoxGeometry(1, 1.5, 0.2);
        
        // Create gradient-like material using standard material
        const material = new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        this.logoMesh = new THREE.Mesh(geometry, material);
        this.logoScene.add(this.logoMesh);

        // Add some lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.logoScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.logoScene.add(directionalLight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate particles slowly
        if (this.particles) {
            this.particles.rotation.y += 0.002;
            this.particles.rotation.x += 0.001;
        }

        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    animateLogo() {
        this.logoAnimationId = requestAnimationFrame(() => this.animateLogo());

        const time = Date.now() * 0.001;

        // Rotate logo
        if (this.logoMesh) {
            this.logoMesh.rotation.y += 0.01;
            this.logoMesh.rotation.x = Math.sin(time) * 0.1;
        }

        // Render the logo scene
        if (this.logoRenderer && this.logoScene && this.logoCamera) {
            this.logoRenderer.render(this.logoScene, this.logoCamera);
        }
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    dispose() {
        // Clean up resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.logoAnimationId) {
            cancelAnimationFrame(this.logoAnimationId);
        }
        
        if (this.logoMesh && this.logoMesh.geometry) this.logoMesh.geometry.dispose();
        if (this.logoMesh && this.logoMesh.material) this.logoMesh.material.dispose();
        if (this.particles && this.particles.geometry) this.particles.geometry.dispose();
        if (this.particles && this.particles.material) this.particles.material.dispose();
        if (this.renderer) this.renderer.dispose();
        if (this.logoRenderer) this.logoRenderer.dispose();
    }
}