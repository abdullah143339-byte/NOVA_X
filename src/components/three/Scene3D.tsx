"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const r = 0.5 + Math.random() * 0.5;
      const g = 0.4 + Math.random() * 0.3;
      const b = 0.8 + Math.random() * 0.2;
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;

      siz[i] = Math.random() * 0.05 + 0.01;
    }

    return [pos, col, siz];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingGeometry() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      group.current.children.forEach((child, i) => {
        child.position.y = Math.sin(state.clock.getElapsedTime() * 0.3 + i) * 0.3;
      });
    }
  });

  return (
    <group ref={group}>
      <mesh position={[2, 0, -2]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#a78bfa"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      <mesh position={[-2, 1, -3]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
      <mesh position={[0, -1, -4]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#c084fc"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <Particles count={150} />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
}
