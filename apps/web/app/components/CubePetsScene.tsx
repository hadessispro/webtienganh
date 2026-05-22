"use client";

/**
 * CubePetsScene
 *
 * 3D pets that wander around the landing-page background. Designed to
 * be interactive (click → speech bubble) WITHOUT blocking the page
 * CTAs underneath. This is the third attempt at getting this right:
 *
 * Round 1: `eventSource={document.body}` → R3F intercepted every click
 *          on the entire page → CTAs broken.
 * Round 2: removed eventSource → pets non-interactive but CTAs work.
 * Round 3 (this file): "interactive zone" pattern. Two layers:
 *
 *   [hover layer]  Canvas with pointer-events: none and an explicit
 *                  document-level pointermove listener that does a
 *                  raycast against the scene. When the cursor IS over
 *                  a pet, we flip pointer-events: auto on the Canvas
 *                  wrapper AND set R3F's hover state ourselves. When
 *                  the cursor is NOT over a pet, pointer-events go
 *                  back to none and clicks pass through to whatever
 *                  is below (the CTAs, the background, links, etc).
 *
 * Effectively: the Canvas only "grabs" pointer events for the few
 * frames the cursor is actually on top of a pet mesh. CTAs work
 * everywhere else.
 */

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Float, OrthographicCamera, Clone, Html } from "@react-three/drei";
import * as THREE from "three";

const QUOTES = [
  "Hello there!", "Bonjour!", "Hola!", "Guten Tag!",
  "Ciao!", "こんにちは", "안녕하세요", "Xin chào!",
  "Keep learning!", "You're doing great!", "Never give up!",
  "Practice makes perfect!", "Learning is fun!", "Meow!", "Woof!",
];

// Preload the models
useGLTF.preload("/models/cat.glb");
useGLTF.preload("/models/dog.glb");
useGLTF.preload("/models/penguin.glb");
useGLTF.preload("/models/lion.glb");

/**
 * HoverGate
 * Lives inside the <Canvas>. Each frame, it raycasts from the mouse
 * position against the scene's pet meshes. If the ray hits a pet,
 * it flips `pointer-events: auto` on the wrapper element passed in
 * via prop. Otherwise it stays `none`.
 *
 * IMPORTANT: We do NOT raycast against `scene.children` (which would
 * also hit the Environment cubemap and force pointer-events:auto
 * everywhere). We only raycast against descendants of groups that
 * marked themselves with `userData.pet = true`. PetModel registers
 * its root group via the `registerHoverable` callback below.
 */
function HoverGate({ wrapperEl }: { wrapperEl: HTMLDivElement | null }) {
  const { scene, raycaster, mouse, camera } = useThree();
  const lastStateRef = useRef<"on" | "off">("off");
  const targetsRef = useRef<THREE.Object3D[]>([]);
  const tickRef = useRef(0);

  useFrame(() => {
    if (!wrapperEl) return;

    // Refresh the targets list every ~30 frames (twice a second at
    // 60fps). Cheap enough, picks up new pets if any are added later.
    tickRef.current++;
    if (tickRef.current % 30 === 0 || targetsRef.current.length === 0) {
      const t: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData?.pet) t.push(obj);
      });
      targetsRef.current = t;
    }
    if (targetsRef.current.length === 0) return;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(targetsRef.current, true);
    const onPet = hits.length > 0;

    const next = onPet ? "on" : "off";
    if (next !== lastStateRef.current) {
      lastStateRef.current = next;
      wrapperEl.style.pointerEvents = onPet ? "auto" : "none";
      wrapperEl.style.cursor = onPet ? "pointer" : "auto";
    }
  });

  return null;
}

function PetModel({ url, initialPosition, scale, floatSpeed = 1, floatIntensity = 1, portal }: any) {
  const gltf = useGLTF(url) as any;

  const translationGroupRef = useRef<THREE.Group>(null);
  const rotationGroupRef = useRef<THREE.Group>(null);
  const positionRef = useRef(
    new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]),
  );

  const [bubbleText, setBubbleText] = useState("");

  const velocity = useRef(
    new THREE.Vector2(
      (Math.random() - 0.5) * 0.03,
      (Math.random() - 0.5) * 0.03,
    ),
  );

  // Mark the group + descendants as 'pet' so HoverGate's raycast can
  // recognize them. We do this after the gltf scene loads via a ref
  // effect.
  useEffect(() => {
    if (!rotationGroupRef.current) return;
    rotationGroupRef.current.userData.pet = true;
    rotationGroupRef.current.traverse((child) => {
      child.userData.pet = true;
    });
  }, []);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setBubbleText(randomQuote);

    // Little bounce on click
    if (rotationGroupRef.current) {
      rotationGroupRef.current.scale.set(scale * 1.3, scale * 0.7, scale * 1.3);
      setTimeout(() => {
        if (rotationGroupRef.current) {
          rotationGroupRef.current.scale.set(scale, scale, scale);
        }
      }, 150);
    }
  };

  // Hide bubble after 3 seconds
  useEffect(() => {
    if (!bubbleText) return;
    const t = setTimeout(() => setBubbleText(""), 3000);
    return () => clearTimeout(t);
  }, [bubbleText]);

  // Wandering & bouncing logic
  useFrame((state, delta) => {
    const { viewport } = state;

    positionRef.current.x += velocity.current.x * (delta * 60);
    positionRef.current.y += velocity.current.y * (delta * 60);

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

    if (translationGroupRef.current) {
      translationGroupRef.current.position.copy(positionRef.current);
    }

    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y += delta * 0.15;

      // Passive eye-parallax — works even when Canvas pointer-events
      // is none, because R3F still tracks the raw mouse position.
      const targetX = state.pointer.x * 2;
      const targetY = state.pointer.y * 2;
      rotationGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rotationGroupRef.current.rotation.x, targetY * 0.2, 0.05,
      );
      rotationGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rotationGroupRef.current.rotation.z, -targetX * 0.2, 0.05,
      );
    }
  });

  return (
    <group ref={translationGroupRef}>
      <Float speed={floatSpeed} rotationIntensity={0.6} floatIntensity={floatIntensity} floatingRange={[-0.5, 0.5]}>
        {/* The rotation group is what HoverGate raycasts against
            (via userData.pet = true on every descendant). onClick is
            fired by R3F when the user clicks while pointer-events:auto
            is active on the wrapper (= when cursor is on this pet). */}
        <group ref={rotationGroupRef} scale={scale} onClick={handleClick}>
          <Clone object={gltf.scene} castShadow receiveShadow />
        </group>

        <Html
          portal={portal}
          position={[0, 1.8 * scale, 0]}
          center
          style={{
            pointerEvents: "none",
            opacity: bubbleText ? 1 : 0,
            transition: "opacity 0.2s",
            visibility: bubbleText ? "visible" : "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "8px 16px",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 900,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              border: "2px solid black",
              whiteSpace: "nowrap",
              transform: bubbleText ? "translateY(-20px) scale(1)" : "translateY(-10px) scale(0.5)",
              transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          >
            {bubbleText || "..."}
            <div
              style={{
                position: "absolute",
                width: "12px",
                height: "12px",
                backgroundColor: "white",
                borderBottom: "2px solid black",
                borderRight: "2px solid black",
                transform: "rotate(45deg)",
                bottom: "-8px",
                left: "50%",
                marginLeft: "-6px",
              }}
            />
          </div>
        </Html>
      </Float>
    </group>
  );
}

export default function CubePetsScene() {
  const portalRef = useRef<HTMLDivElement>(null);
  // Use state for the wrapper element so HoverGate re-renders after
  // mount when the ref is finally set.
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <div
        ref={portalRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />

      <div
        ref={setWrapperEl}
        // Start with pointer-events: none. HoverGate flips this to
        // "auto" whenever the cursor is on top of a pet (raycast hit)
        // and back to "none" otherwise. So CTAs are clickable
        // everywhere EXCEPT directly on a pet, where the pet wins.
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Canvas shadows style={{ pointerEvents: "inherit" }}>
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

          <HoverGate wrapperEl={wrapperEl} />

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
