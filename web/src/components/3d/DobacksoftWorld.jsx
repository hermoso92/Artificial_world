
import React, { useMemo } from 'react';
import { Sky, Cloud } from '@react-three/drei';
import { usePlane, useBox } from '@react-three/cannon';
import * as THREE from 'three';

/* eslint-disable react/no-unknown-property */

// Procedural Trees
const Tree = ({ position }) => {
  const [ref] = useBox(() => ({ type: 'Static', position, args: [1, 5, 1] }));
  return (
    <group ref={ref}>
      {/* Trunk */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 4, 8]} />
        <meshStandardMaterial color="#4a3b2c" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.5, 5, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[2, 4, 8]} />
        <meshStandardMaterial color="#3a7033" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Procedural Buildings
const Building = ({ position, args, color }) => {
  const [ref] = useBox(() => ({ type: 'Static', position, args }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
    </mesh>
  );
};

export const DobacksoftWorld = () => {
  // Ground Plane
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    material: 'ground'
  }));

  // Generate random trees
  const trees = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      // Keep center clear
      if (Math.abs(x) < 20 && Math.abs(z) < 20) return null;
      return <Tree key={`tree-${i}`} position={[x, 2, z]} />;
    }).filter(Boolean);
  }, []);

  // Generate some buildings
  const buildings = useMemo(() => {
    const b = [];
    const colors = ['#1e293b', '#334155', '#0f172a'];
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
      const width = 10 + Math.random() * 20;
      const depth = 10 + Math.random() * 20;
      const height = 20 + Math.random() * 60;
      b.push(
        <Building 
          key={`bldg-${i}`} 
          position={[x, height / 2, z]} 
          args={[width, height, depth]} 
          color={colors[Math.floor(Math.random() * colors.length)]} 
        />
      );
    }
    return b;
  }, []);

  return (
    <>
      {/* Environment & Lighting */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[100, 100, 50]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <fog attach="fog" args={['#87CEEB', 50, 300]} />

      {/* Clouds */}
      <Cloud position={[-50, 50, -50]} speed={0.2} opacity={0.5} />
      <Cloud position={[50, 60, 50]} speed={0.2} opacity={0.5} />

      {/* Ground */}
      <mesh ref={groundRef} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a3615" roughness={1} metalness={0} />
        {/* Grid helper for scale */}
        <gridHelper args={[1000, 100, '#000000', '#000000']} position={[0, 0.01, 0]} material-opacity={0.2} material-transparent />
      </mesh>

      {/* Scenery */}
      {trees}
      {buildings}
    </>
  );
};
