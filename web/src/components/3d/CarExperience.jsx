
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { DobacksoftWorld } from './DobacksoftWorld.jsx';
import { usePlayerControls } from '../../hooks/usePlayerControls.js';
import { ReturnButton, ControlsHelp, Minimap, Speedometer } from './UIComponents.jsx';

/* eslint-disable react/no-unknown-property */

const CarPlayer = () => {
  const { camera } = useThree();
  const controls = usePlayerControls();
  
  // Car Physics Body Configuration
  const [ref, api] = useBox(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 1, 0],
    args: [1, 0.5, 2],
    linearDamping: 0.3,
    angularDamping: 0.3,
    kinematic: false,
    material: { friction: 0.1 }
  }));

  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubPos = api.position.subscribe((p) => (position.current = p));
    return () => { unsubVel(); unsubPos(); };
  }, [api]);

  useFrame(() => {
    const { forward, backward, left, right, sprint, jump } = controls;
    
    // 1. KEYBOARD INPUT VERIFICATION
    // console.log('Keys pressed:', { forward, backward, left, right, sprint, jump });
    
    // Calculate speed for UI
    const currentSpeed = Math.sqrt(velocity.current[0]**2 + velocity.current[2]**2);
    const speedKmh = Math.round(currentSpeed * 3.6 * 10); // Scaled for UI
    const speedEl = document.getElementById('speed-value');
    if (speedEl) speedEl.innerText = speedKmh;

    // Update Minimap
    const dot = document.getElementById('minimap-dot');
    if (dot) {
      const scale = 0.2;
      dot.style.transform = `translate(${position.current[0] * scale}px, ${position.current[2] * scale}px)`;
    }

    // 3. MOVEMENT LOGIC IMPLEMENTATION
    const speed = sprint ? 0.3 : 0.2;
    const newVelocity = [0, velocity.current[1], 0]; // Preserve Y velocity for gravity

    // Apply movement based on world axes as requested
    if (forward) newVelocity[2] -= speed * 50; // Scaled up for visible movement
    if (backward) newVelocity[2] += speed * 50;
    if (left) newVelocity[0] -= speed * 50;
    if (right) newVelocity[0] += speed * 50;

    // Jump logic
    if (jump && Math.abs(velocity.current[1]) < 0.1) {
      newVelocity[1] = 5;
    }

    // Apply velocity
    api.velocity.set(...newVelocity);
    // console.log('Setting velocity:', newVelocity);

    // 5. CAMERA FOLLOW SYSTEM
    const pos = position.current;
    const idealPos = new THREE.Vector3(pos[0], pos[1] + 2, pos[2] + 5);
    camera.position.lerp(idealPos, 0.1);
    camera.lookAt(pos[0], pos[1] + 1, pos[2]);
  });

  return (
    <group ref={ref}>
      {/* Car Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.5, 2]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow receiveShadow position={[0, 0.4, -0.2]}>
        <boxGeometry args={[0.9, 0.4, 1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      {[-0.55, 0.55].map((x) => 
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.2, z]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Headlights */}
      <pointLight position={[0, 0, -1.2]} distance={20} intensity={2} color="#ffffff" castShadow />
    </group>
  );
};

const CarExperience = ({ onReturn }) => {
  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <ReturnButton onReturn={onReturn} />
      <ControlsHelp />
      <Minimap />
      <Speedometer />
      
      <div className="absolute inset-0 cursor-crosshair">
        <Canvas shadows camera={{ fov: 60 }}>
          <Physics gravity={[0, -20, 0]} defaultContactMaterial={{ friction: 0.1 }}>
            <DobacksoftWorld />
            <CarPlayer />
          </Physics>
        </Canvas>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono pointer-events-none">
        Use WASD to drive. Shift to sprint. Space to jump.
      </div>
    </div>
  );
};

export default CarExperience;
