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
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

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
            
            // Size
            sizes[i] = Math.random() * 3 + 1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Floating animation
                    pos.y += sin(time * 0.001 + position.x * 0.01) * 0.5;
                    pos.x += cos(time * 0.0015 + position.z * 0.01) * 0.3;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createLogo() {
        // Create a stylized "N" for NEXUS AI
        const shape = new THREE.Shape();
        
        // Create letter "N" outline
        shape.moveTo(-0.5, -0.8);
        shape.lineTo(-0.5, 0.8);
        shape.lineTo(-0.3, 0.8);
        shape.lineTo(-0.3, -0.2);
        shape.lineTo(0.3, 0.8);
        shape.lineTo(0.5, 0.8);
        shape.lineTo(0.5, -0.8);
        shape.lineTo(0.3, -0.8);
        shape.lineTo(0.3, 0.2);
        shape.lineTo(-0.3, -0.8);
        shape.lineTo(-0.5, -0.8);

        // Extrude the shape
        this.logoGeometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.2,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.05,
            bevelThickness: 0.05
        });

        // Create gradient material
        this.logoMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x6366f1) },
                color2: { value: new THREE.Color(0x764ba2) }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                uniform float time;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    
                    vec3 pos = position;
                    pos += normal * sin(time * 0.002 + position.y * 5.0) * 0.02;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float time;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    float mixFactor = (vPosition.y + 1.0) * 0.5;
                    mixFactor += sin(time * 0.003) * 0.1;
                    vec3 color = mix(color1, color2, mixFactor);
                    
                    // Add some lighting
                    float light = max(dot(vNormal, vec3(0.5, 0.5, 1.0)), 0.3);
                    color *= light;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        this.logoMesh = new THREE.Mesh(this.logoGeometry, this.logoMaterial);
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

        const time = Date.now();

        // Update particle shader time
        if (this.particles && this.particles.material) {
            this.particles.material.uniforms.time.value = time;
        }

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

        const time = Date.now();

        // Update logo shader time
        if (this.logoMaterial) {
            this.logoMaterial.uniforms.time.value = time;
        }

        // Rotate logo
        if (this.logoMesh) {
            this.logoMesh.rotation.y += 0.01;
            this.logoMesh.rotation.x = Math.sin(time * 0.001) * 0.1;
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
        
        if (this.logoGeometry) this.logoGeometry.dispose();
        if (this.logoMaterial) this.logoMaterial.dispose();
        if (this.renderer) this.renderer.dispose();
        if (this.logoRenderer) this.logoRenderer.dispose();
    }
}