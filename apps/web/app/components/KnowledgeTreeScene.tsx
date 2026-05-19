"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type KnowledgeTreeSceneProps = {
  growth: number;
};

const flowerPalette = [0xf4b5c7, 0xf1d06f, 0xd8c4f4, 0xf7f1dc, 0x9fd4e8, 0xe6a98f];

export function KnowledgeTreeScene({ growth }: KnowledgeTreeSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let frameId = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 2.15, -2.15, 0.1, 100);
    camera.position.set(4.4, 3.3, 6.2);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf8fff6, 0x8eb69b, 1.45));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(4.5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb7e5ba, 1.3);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    const forest = new THREE.Group();
    forest.scale.setScalar(0.86);
    scene.add(forest);

    const growthScale = Math.min(1.16, 0.9 + growth / 54);
    const bloomCount = Math.min(16, Math.max(4, Math.floor(growth / 2)));

    const mat = {
      ground: new THREE.MeshStandardMaterial({ color: 0x2d5a1b, roughness: 0.9 }),
      moss: new THREE.MeshStandardMaterial({ color: 0x74c69d, roughness: 0.86 }),
      mossLight: new THREE.MeshStandardMaterial({ color: 0xc8efc8, roughness: 0.82 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x6a4528, roughness: 0.82 }),
      barkLight: new THREE.MeshStandardMaterial({ color: 0xb68458, roughness: 0.76 }),
      leafDark: new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.86 }),
      leafMid: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.84 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.8 }),
      leafLight: new THREE.MeshStandardMaterial({ color: 0x95d5b2, roughness: 0.76 }),
      path: new THREE.MeshStandardMaterial({ color: 0xdaf1de, emissive: 0x5ca87c, emissiveIntensity: 0.24, roughness: 0.58 }),
      node: new THREE.MeshStandardMaterial({ color: 0xf5f7a8, emissive: 0x8be69b, emissiveIntensity: 0.32, roughness: 0.48 }),
      shadow: new THREE.MeshBasicMaterial({ color: 0x12362f, transparent: true, opacity: 0.14 }),
      mist: new THREE.MeshBasicMaterial({ color: 0xd8f3dc, transparent: true, opacity: 0.16, depthWrite: false }),
      rock: new THREE.MeshStandardMaterial({ color: 0x8aa694, roughness: 0.94 })
    };

    function addMesh(mesh: THREE.Mesh, parent: THREE.Group = forest) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function addCylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
      const direction = end.clone().sub(start);
      const length = direction.length();
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius, length, 16), material);
      branch.position.copy(start).add(end).multiplyScalar(0.5);
      branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      return addMesh(branch);
    }

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.9, 64), mat.shadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.2, 0.08);
    shadow.scale.set(1.18, 0.36, 1);
    forest.add(shadow);

    const island = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 3.05, 0.42, 72), mat.ground);
    island.position.y = -0.88;
    island.scale.z = 0.42;
    addMesh(island);

    const mossTop = new THREE.Mesh(new THREE.CylinderGeometry(2.52, 2.68, 0.17, 72), mat.moss);
    mossTop.position.y = -0.62;
    mossTop.scale.z = 0.4;
    addMesh(mossTop);

    const brightMoss = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.3, 0.07, 72), mat.mossLight);
    brightMoss.position.set(-0.04, -0.5, -0.02);
    brightMoss.scale.z = 0.33;
    addMesh(brightMoss);

    const mist = new THREE.Mesh(new THREE.CircleGeometry(2.35, 64), mat.mist);
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(0.08, -0.43, 0);
    mist.scale.set(1.25, 0.34, 1);
    forest.add(mist);

    function addPine(x: number, z: number, height: number, scale: number) {
      const group = new THREE.Group();
      group.position.set(x, -0.54, z);
      group.scale.setScalar(scale);
      forest.add(group);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, height * 0.58, 12), mat.bark);
      trunk.position.y = (height * 0.58) / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      const tiers = 4;
      for (let index = 0; index < tiers; index += 1) {
        const tier = new THREE.Mesh(
          new THREE.ConeGeometry(height * (0.23 - index * 0.032), height * 0.34, 24),
          [mat.leafDark, mat.leafMid, mat.leaf, mat.leafLight][index]
        );
        tier.position.y = height * (0.42 + index * 0.18);
        tier.castShadow = true;
        tier.receiveShadow = true;
        group.add(tier);
      }

      return group;
    }

    function addRoundTree(x: number, z: number, size: number, scale: number) {
      const group = new THREE.Group();
      group.position.set(x, -0.54, z);
      group.scale.setScalar(scale);
      forest.add(group);

      const trunkHeight = size * 0.92;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.08, size * 0.12, trunkHeight, 16), mat.barkLight);
      trunk.position.y = trunkHeight / 2;
      trunk.scale.z = 0.78;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      addCylinderBetween(
        new THREE.Vector3(x, -0.16, z),
        new THREE.Vector3(x - size * 0.34, size * 0.52, z - 0.02),
        size * 0.035,
        mat.bark
      );
      addCylinderBetween(
        new THREE.Vector3(x, -0.14, z),
        new THREE.Vector3(x + size * 0.35, size * 0.58, z),
        size * 0.035,
        mat.bark
      );

      const canopy = [
        [-0.28, 0.92, 0, 0.42, mat.leafMid],
        [0.04, 1.06, -0.02, 0.5, mat.leaf],
        [0.38, 0.9, 0.02, 0.42, mat.leafLight],
        [-0.03, 0.78, 0.22, 0.4, mat.leafDark],
        [0.22, 0.76, 0.26, 0.36, mat.leaf]
      ] as const;

      canopy.forEach(([cx, cy, cz, radius, material]) => {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(size * radius, 32, 24), material);
        crown.position.set(cx * size, cy * size, cz * size);
        crown.scale.set(1.18, 0.72, 0.86);
        crown.castShadow = true;
        crown.receiveShadow = true;
        group.add(crown);
      });

      return group;
    }

    addPine(-1.95, -0.06, 1.45, 0.72);
    addPine(-1.25, 0.02, 2.1, 0.9);
    addRoundTree(-0.55, 0.1, 1.35, 0.9 * growthScale);
    addPine(0.34, -0.08, 2.35, 0.95 * growthScale);
    addRoundTree(1.03, 0.08, 1.55, growthScale);
    addPine(1.78, 0.02, 1.65, 0.82);

    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.28 + (index % 3) * 0.06, 8), mat.leaf);
      blade.position.set(Math.cos(angle) * (1.3 + (index % 4) * 0.28), -0.35, Math.sin(angle) * 0.24);
      blade.rotation.z = Math.sin(angle) * 0.28;
      blade.castShadow = true;
      forest.add(blade);
    }

    for (let index = 0; index < 4; index += 1) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + index * 0.015, 0), mat.rock);
      rock.position.set(-1.55 + index * 1.04, -0.45, 0.12 + (index % 2) * 0.08);
      rock.scale.set(1.35, 0.55, 0.82);
      addMesh(rock);
    }

    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.55, -0.36, 0.28),
      new THREE.Vector3(-0.78, -0.29, 0.42),
      new THREE.Vector3(0.08, -0.3, 0.36),
      new THREE.Vector3(0.92, -0.28, 0.26),
      new THREE.Vector3(1.62, -0.33, 0.18)
    ]);
    const progressPath = new THREE.Mesh(new THREE.TubeGeometry(pathCurve, 48, 0.018, 10, false), mat.path);
    progressPath.castShadow = false;
    progressPath.receiveShadow = false;
    forest.add(progressPath);

    const nodeCount = Math.max(1, Math.min(4, Math.ceil(growth / 25)));
    for (let index = 0; index < 4; index += 1) {
      const point = pathCurve.getPoint(index / 3);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 12), index < nodeCount ? mat.node : mat.mossLight);
      node.position.copy(point);
      node.position.y += 0.035;
      node.scale.set(1, 0.42, 1);
      node.castShadow = true;
      node.receiveShadow = true;
      forest.add(node);
    }

    for (let index = 0; index < bloomCount; index += 1) {
      const flower = new THREE.Group();
      const color = flowerPalette[index % flowerPalette.length];
      const petalMat = new THREE.MeshStandardMaterial({ color, roughness: 0.68 });
      const centerMat = new THREE.MeshStandardMaterial({ color: 0xf4db88, roughness: 0.62 });
      const x = -0.95 + (index % 6) * 0.36;
      const y = 0.84 + (index % 4) * 0.15;
      const z = 0.54 + Math.sin(index * 1.7) * 0.08;

      for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), petalMat);
        const petalAngle = (petalIndex / 5) * Math.PI * 2;
        petal.position.set(Math.cos(petalAngle) * 0.046, Math.sin(petalAngle) * 0.046, 0);
        petal.scale.set(1.25, 0.76, 0.36);
        flower.add(petal);
      }

      const center = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), centerMat);
      center.position.z = 0.02;
      flower.add(center);
      flower.position.set(x, y, z);
      flower.rotation.set(0.08, 0, -0.1 + (index % 4) * 0.08);
      forest.add(flower);
    }

    const rootCurves = [
      [
        new THREE.Vector3(-2.18, -0.9, 0.02),
        new THREE.Vector3(-2.42, -1.03, 0.06),
        new THREE.Vector3(-2.5, -1.2, 0.12)
      ],
      [
        new THREE.Vector3(2.06, -0.88, 0.02),
        new THREE.Vector3(2.28, -1.02, 0.08),
        new THREE.Vector3(2.34, -1.18, 0.12)
      ],
      [
        new THREE.Vector3(0.18, -0.9, -0.16),
        new THREE.Vector3(0.24, -1.08, -0.12),
        new THREE.Vector3(0.18, -1.24, -0.06)
      ]
    ];

    rootCurves.forEach((points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const root = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.018, 8, false), mat.bark);
      addMesh(root);
    });

    const resize = () => {
      const width = Math.max(260, mount.clientWidth);
      const height = Math.max(260, mount.clientHeight);
      const aspect = width / height;
      const frustum = 5.55;
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      forest.rotation.y = Math.sin(elapsed * 0.34) * 0.12;
      forest.position.y = Math.sin(elapsed * 1.05) * 0.018;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => materials.add(material));
          } else {
            materials.add(object.material);
          }
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [growth]);

  return <div className="tree-scene" ref={mountRef} />;
}
