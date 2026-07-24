"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function CrystalObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Gentle mouse-reactive rotation
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      pointer.y * 0.3,
      0.05
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      pointer.x * 0.3,
      0.05
    );

    // Slow continuous rotation
    meshRef.current.rotation.z += delta * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1.2} floatingRange={[-0.1, 0.1]}>
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={512}
          transmission={0.95}
          roughness={0.05}
          thickness={0.3}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          color="#c4b5fd"
          attenuationColor="#818cf8"
          attenuationDistance={0.5}
        />
      </mesh>
    </Float>
  );
}

function SceneInner() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#e0e7ff" />
      <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 0, 4]} intensity={0.4} color="#818cf8" />
      <CrystalObject />
      <Environment preset="city" environmentIntensity={0.3} />
    </>
  );
}

interface Hero3DProps {
  className?: string;
}

export function Hero3D({ className = "" }: Hero3DProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <SceneInner />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default Hero3D;
