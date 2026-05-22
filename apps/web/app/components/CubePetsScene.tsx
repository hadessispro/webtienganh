"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float, OrthographicCamera, Clone, Html } from "@react-three/drei";
import * as THREE from "three";

const QUOTES = [
  "Hello there!", "Bonjour!", "Hola!", "Guten Tag!", 
  "Ciao!", "こんにちは", "안녕하세요", "Xin chào!", 
  "Keep learning!", "You're doing great!", "Never give up!", 
  "Practice makes perfect!", "Learning is fun!", "Meow!", "Woof!"
];

// Preload the models
useGLTF.preload("/models/cat.glb");
useGLTF.preload("/models/dog.glb");
useGLTF.preload("/models/penguin.glb");
useGLTF.preload("/models/lion.glb");

function PetModel({ url, initialPosition, scale, floatSpeed = 1, floatIntensity = 1, portal }: any) {
  const gltf = useGLTF(url) as any;
  
  const translationGroupRef = useRef<THREE.Group>(null);
  const rotationGroupRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]));
  
  const [bubbleText, setBubbleText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Random velocity for wandering
  const velocity = useRef(
    new THREE.Vector2(
      (Math.random() - 0.5) * 0.03,
      (Math.random() - 0.5) * 0.03
    )
  );

  const handleClick = (e: any) => {
    e.stopPropagation();
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setBubbleText(randomQuote);
    
    // Add a little bounce on click
    if (rotationGroupRef.current) {
      rotationGroupRef.current.scale.set(scale * 1.3, scale * 0.7, scale * 1.3);
      setTimeout(() => {
        if (rotationGroupRef.current) rotationGroupRef.current.scale.set(scale, scale, scale);
      }, 150);
    }
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
    setIsDragging(true);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  // Hide bubble after 3 seconds
  useEffect(() => {
    if (bubbleText) {
      const timer = setTimeout(() => setBubbleText(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [bubbleText]);

  // Wandering, Dragging & Bouncing logic
  useFrame((state, delta) => {
    const { viewport, pointer } = state;

    if (isDragging) {
      // Drag follow mouse
      positionRef.current.x = pointer.x * viewport.width / 2;
      positionRef.current.y = pointer.y * viewport.height / 2;
      // Reset velocity so it doesn't fly away fast when released
      velocity.current.set((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03);
    } else {
      // Wandering
      positionRef.current.x += velocity.current.x * (delta * 60);
      positionRef.current.y += velocity.current.y * (delta * 60);

      // Bounce off screen edges (with some padding)
      const paddingX = 2;
      const paddingY = 2;
      
      if (positionRef.current.x > viewport.width / 2 - paddingX) {
        positionRef.current.x = viewport.width / 2 - paddingX;
        velocity.current.x *= -1;
      } else if (positionRef.current.x < -viewport.width / 2 + paddingX) {
        positionRef.current.x = -viewport.width / 2 + paddingX;
        velocity.current.x *= -1;
      }
      
      if (positionRef.current.y > viewport.height / 2 - paddingY) {
        positionRef.current.y = viewport.height / 2 - paddingY;
        velocity.current.y *= -1;
      } else if (positionRef.current.y < -viewport.height / 2 + paddingY) {
        positionRef.current.y = -viewport.height / 2 + paddingY;
        velocity.current.y *= -1;
      }
    }

    // Apply translation
    if (translationGroupRef.current) {
      translationGroupRef.current.position.copy(positionRef.current);
    }

    // Apply rotation (independent of Html bubble)
    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y += delta * 0.15;
      
      // Mouse interaction parallax (eyes follow mouse slightly)
      const targetX = (state.pointer.x * 2);
      const targetY = (state.pointer.y * 2);
      
      rotationGroupRef.current.rotation.x = THREE.MathUtils.lerp(rotationGroupRef.current.rotation.x, targetY * 0.2, 0.05);
      rotationGroupRef.current.rotation.z = THREE.MathUtils.lerp(rotationGroupRef.current.rotation.z, -targetX * 0.2, 0.05);
    }
  });

  return (
    <group ref={translationGroupRef}>
      <Float speed={floatSpeed} rotationIntensity={0.6} floatIntensity={floatIntensity} floatingRange={[-0.5, 0.5]}>
        
        {/* Rotation Group (only affects the mesh, NOT the speech bubble) */}
        <group 
          ref={rotationGroupRef} 
          scale={scale} 
          onClick={handleClick} 
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerOver={() => document.body.style.cursor = isDragging ? 'grabbing' : 'pointer'} 
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <Clone object={gltf.scene} castShadow receiveShadow />
        </group>
        
        {/* Speech Bubble (Always mounted, toggle visibility. Attached to Translation group so it stays upright) */}
        <Html portal={portal} position={[0, 1.8 * scale, 0]} center style={{ pointerEvents: 'none', opacity: bubbleText ? 1 : 0, transition: 'opacity 0.2s', visibility: bubbleText ? 'visible' : 'hidden' }}>
          <div 
            style={{ 
              backgroundColor: 'white',
              color: 'black',
              padding: '8px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 900,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              border: '2px solid black',
              whiteSpace: 'nowrap',
              transform: bubbleText ? 'translateY(-20px) scale(1)' : 'translateY(-10px) scale(0.5)', 
              transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {bubbleText || "..."}
            <div style={{ 
              position: 'absolute',
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              borderBottom: '2px solid black',
              borderRight: '2px solid black',
              transform: 'rotate(45deg)',
              bottom: '-8px',
              left: '50%',
              marginLeft: '-6px'
            }} />
          </div>
        </Html>
        
      </Float>
    </group>
  );
}

export default function CubePetsScene() {
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Bind R3F events to the body so we can click through the pointer-events-none container
    setEventSource(document.body);
  }, []);

  if (!eventSource) return null;

  return (
    <>
      {/* Explicit portal container for Html bubbles to ensure they stay fixed to screen */}
      <div ref={portalRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 100 }} />
      
      <div className="pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 50, overflow: 'hidden' }}>
        <Canvas shadows eventSource={eventSource || undefined} eventPrefix="client" style={{ pointerEvents: 'none' }}>
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={80} />
          
          <ambientLight intensity={0.6} color="#ffffff" />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={1.2}
            color="#ffffff"
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-10, -10, -10]} intensity={0.4} color="#a1a1aa" />
          
          <PetModel url="/models/cat.glb" initialPosition={[-4, 2, 0]} scale={0.6} portal={portalRef} />
          <PetModel url="/models/dog.glb" initialPosition={[4, -2, 0]} scale={0.6} floatSpeed={1.2} portal={portalRef} />
          <PetModel url="/models/penguin.glb" initialPosition={[-3, -3, 0]} scale={0.6} floatSpeed={0.8} portal={portalRef} />
          <PetModel url="/models/lion.glb" initialPosition={[3, 3, 0]} scale={0.6} floatSpeed={1.5} portal={portalRef} />
          
          <Environment preset="city" />
        </Canvas>
      </div>
    </>
  );
}
