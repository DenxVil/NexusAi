// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI 3D Component for React

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Nexus3DProps {
  width?: number;
  height?: number;
  className?: string;
}

const Nexus3D: React.FC<Nexus3DProps> = ({ 
  width = 300, 
  height = 150, 
  className = '' 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  const textMeshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current; // Store reference to avoid stale closure

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    currentMount.appendChild(renderer.domElement);

    // Create 3D text group
    const textGroup = new THREE.Group();
    textMeshRef.current = textGroup;

    // Create "NEXUS" text using box geometries
    const createLetter = (geometry: THREE.BoxGeometry, x: number, color: number = 0x6366f1) => {
      const material = new THREE.MeshPhongMaterial({ 
        color,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = x;
      return mesh;
    };

    // Letter geometries (simplified letter shapes)
    const letterGeometry = new THREE.BoxGeometry(0.3, 1, 0.1);
    
    // "NEXUS" letters
    const letters = [
      createLetter(letterGeometry, -2.5, 0x6366f1), // N
      createLetter(letterGeometry, -1.8, 0x8b5cf6), // E
      createLetter(letterGeometry, -1.1, 0xa855f7), // X
      createLetter(letterGeometry, -0.4, 0xc084fc), // U
      createLetter(letterGeometry, 0.3, 0xd8b4fe),  // S
    ];

    letters.forEach(letter => textGroup.add(letter));

    // "AI" text
    const aiGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.1);
    const aiLetters = [
      createLetter(aiGeometry, 1.3, 0x06b6d4), // A
      createLetter(aiGeometry, 1.9, 0x0891b2), // I
    ];

    aiLetters.forEach(letter => {
      letter.position.y = -0.3;
      textGroup.add(letter);
    });

    scene.add(textGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Animation
    const animate = () => {
      if (textGroup) {
        textGroup.rotation.y += 0.01;
        textGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  return (
    <div 
      ref={mountRef} 
      className={`nexus-3d ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'inline-block'
      }}
    />
  );
};

export { Nexus3D };