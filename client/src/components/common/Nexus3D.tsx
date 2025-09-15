import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Nexus3DProps {
  className?: string;
}

export const Nexus3D: React.FC<Nexus3DProps> = ({ className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current; // Capture the ref value

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff00ff, 0.6, 100);
    pointLight.position.set(-1, -1, 2);
    scene.add(pointLight);

    // Position camera
    camera.position.z = 5;

    // Create letter boxes to represent "NEXUS AI"
    const createTextBox = (text: string, position: THREE.Vector3, color: number = 0x00ffff) => {
      const boxGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.1);
      const boxMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
      });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.copy(position);
      return box;
    };

    // NEXUS
    const nexusBoxes = [
      createTextBox('N', new THREE.Vector3(-2.5, 0.2, 0), 0x00ffff),
      createTextBox('E', new THREE.Vector3(-2.0, 0.2, 0), 0x1a8cff),
      createTextBox('X', new THREE.Vector3(-1.5, 0.2, 0), 0x3d5eff),
      createTextBox('U', new THREE.Vector3(-1.0, 0.2, 0), 0x5a30ff),
      createTextBox('S', new THREE.Vector3(-0.5, 0.2, 0), 0x7700ff),
    ];

    // AI
    const aiBoxes = [
      createTextBox('A', new THREE.Vector3(0.5, -0.2, 0), 0xff0077),
      createTextBox('I', new THREE.Vector3(1.0, -0.2, 0), 0xff3d00),
    ];

    [...nexusBoxes, ...aiBoxes].forEach((box, index) => {
      scene.add(box);
      
      // Store animation data
      const originalPosition = box.position.clone();
      const animationOffset = index * 0.2;
      
      (box as any).originalPosition = originalPosition;
      (box as any).animationOffset = animationOffset;
    });

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId: 0
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      sceneRef.current.animationId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Animate all boxes
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh && (child as any).originalPosition) {
          const originalPos = (child as any).originalPosition;
          const offset = (child as any).animationOffset;
          
          // Floating animation
          child.position.y = originalPos.y + Math.sin(time * 2 + offset) * 0.1;
          
          // Rotation
          child.rotation.z = Math.sin(time + offset) * 0.1;
          child.rotation.x = Math.sin(time * 0.5 + offset) * 0.05;
          
          // Color animation for material
          if (child.material instanceof THREE.MeshPhongMaterial) {
            const hue = (time * 0.1 + offset) % 1;
            child.material.color.setHSL(hue, 0.8, 0.6);
          }
        }
      });

      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!currentMount || !sceneRef.current) return;
      
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (currentMount && sceneRef.current.renderer.domElement.parentNode) {
          currentMount.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`nexus-3d ${className || ''}`}
      style={{ 
        width: '100%', 
        height: '200px',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};