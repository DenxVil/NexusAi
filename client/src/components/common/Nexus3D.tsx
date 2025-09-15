// Created with love 🩶 by Denvil 🧑‍💻
// NEXUS AI 3D Component for React

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Nexus3DProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Nexus3D: React.FC<Nexus3DProps> = ({ 
  width = 400, 
  height = 300, 
  className = '' 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const logoMeshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // Create particles
    createParticles(scene);
    
    // Create NEXUS AI logo
    createNexusLogo(scene);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Rotate particles
      if (particlesRef.current) {
        particlesRef.current.rotation.x += 0.001;
        particlesRef.current.rotation.y += 0.002;
      }

      // Animate logo
      if (logoMeshRef.current) {
        logoMeshRef.current.rotation.y += 0.01;
        logoMeshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  const createParticles = (scene: THREE.Scene) => {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // Color (NEXUS AI theme colors - blue to purple)
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

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);
  };

  const createNexusLogo = (scene: THREE.Scene) => {
    // Create NEXUS AI text geometry
    const group = new THREE.Group();

    // Create multiple geometric shapes to represent "NEXUS AI"
    const shapes = [
      { x: -2, y: 0, z: 0, width: 0.3, height: 1.5, depth: 0.1 }, // N
      { x: -1.2, y: 0, z: 0, width: 1, height: 0.3, depth: 0.1 }, // E (top)
      { x: -1.2, y: -0.4, z: 0, width: 0.6, height: 0.3, depth: 0.1 }, // E (middle)
      { x: -1.2, y: -0.8, z: 0, width: 1, height: 0.3, depth: 0.1 }, // E (bottom)
      { x: 0, y: 0, z: 0, width: 0.3, height: 1.5, depth: 0.1 }, // X (left)
      { x: 0.7, y: 0, z: 0, width: 0.3, height: 1.5, depth: 0.1 }, // X (right)
      { x: 1.5, y: 0.4, z: 0, width: 1, height: 0.3, depth: 0.1 }, // U (top)
      { x: 1.5, y: -0.4, z: 0, width: 0.3, height: 1, depth: 0.1 }, // U (left)
      { x: 2.2, y: -0.4, z: 0, width: 0.3, height: 1, depth: 0.1 }, // U (right)
    ];

    shapes.forEach(shape => {
      const geometry = new THREE.BoxGeometry(shape.width, shape.height, shape.depth);
      const material = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(shape.x, shape.y, shape.z);
      group.add(mesh);
    });

    // Scale down the logo
    group.scale.set(0.5, 0.5, 0.5);
    logoMeshRef.current = group;
    scene.add(group);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x6366f1, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);
  };

  return (
    <div 
      ref={mountRef} 
      className={`nexus-3d ${className}`}
      style={{ width, height }}
    />
  );
};

export default Nexus3D;