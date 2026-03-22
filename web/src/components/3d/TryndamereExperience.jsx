
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { DobacksoftWorld } from './DobacksoftWorld.jsx';
import { usePlayerControls } from '../../hooks/usePlayerControls.js';
import { ReturnButton, ControlsHelp, Minimap, HealthBar } from './UIComponents.jsx';

/* eslint-disable react/no-unknown-property */

const TryndamerePlayer = () => {
  const { camera } = useThree();
  const controls = usePlayerControls();
  
  // 1. ROTATION LOGIC SEPARATION
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });

  // 2. MOUSE LOOK IMPLEMENTATION
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (document.pointerLockElement) {
        setCameraRotation((prev) => {
          const deltaX = e.movementX * 0.005;
          const deltaY = e.movementY * 0.005;
          // Clamp X rotation to prevent flipping
          const newX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x - deltaY));
          return { x: newX, y: prev.y - deltaX };
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // 3. CHARACTER BODY CONFIGURATION
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [0, 1, 0],
    args: [0.3, 1],
    fixedRotation: true, // CRITICAL - prevents spinning
    linearDamping: 0.5,
    angularDamping: 1, // HIGH - prevent any rotation
    material: { friction: 0 }
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
    
    // Update Minimap
    const dot = document.getElementById('minimap-dot');
    if (dot) {
      const scale = 0.2;
      dot.style.transform = `translate(${position.current[0] * scale}px, ${position.current[2] * scale}px)`;
    }

    // 4. MOVEMENT IN CAMERA DIRECTION
    const speed = sprint ? 15 : 8;
    
    const forwardVec = new THREE.Vector3(Math.sin(cameraRotation.y), 0, Math.cos(cameraRotation.y));
    const rightVec = new THREE.Vector3(Math.cos(cameraRotation.y), 0, -Math.sin(cameraRotation.y));

    let moveX = 0;
    let moveZ = 0;

    if (forward) {
      moveX += forwardVec.x * speed;
      moveZ += forwardVec.z * speed;
    }
    if (backward) {
      moveX -= forwardVec.x * speed;
      moveZ -= forwardVec.z * speed;
    }
    if (left) {
      moveX -= rightVec.x * speed;
      moveZ -= rightVec.z * speed;
    }
    if (right) {
      moveX += rightVec.x * speed;
      moveZ += rightVec.z * speed;
    }

    // Preserve Y velocity for gravity
    api.velocity.set(moveX, velocity.current[1], moveZ);

    // Jump
    if (jump && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(moveX, 10, moveZ);
    }

    // 5. CAMERA POSITION & ROTATION
    const pos = position.current;
    camera.position.set(pos[0], pos[1] + 1.6, pos[2]);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(cameraRotation.x, cameraRotation.y, 0);
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#f87171" roughness={0.5} />
      </mesh>
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} />
      </mesh>
      {/* Giant Sword */}
      <mesh castShadow receiveShadow position={[0.4, 0, 0.3]} rotation={[Math.PI/4, 0, 0]}>
        <boxGeometry args={[0.05, 1.5, 0.2]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

const TryndamereExperience = ({ onReturn }) => {
  const handleCanvasClick = () => {
    document.body.requestPointerLock();
  };

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <ReturnButton onReturn={onReturn} />
      <ControlsHelp />
      <Minimap />
      <HealthBar />
      
      <div className="absolute inset-0 cursor-crosshair" onClick={handleCanvasClick}>
        <Canvas shadows camera={{ fov: 75 }}>
          <Physics gravity={[0, -30, 0]}>
            <DobacksoftWorld />
            <TryndamerePlayer />
          </Physics>
        </Canvas>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono pointer-events-none bg-slate-900/50 px-4 py-1 rounded-full backdrop-blur-sm">
        Click to lock mouse. Press ESC to unlock.
      </div>
    </div>
  );
};

export default TryndamereExperience;
