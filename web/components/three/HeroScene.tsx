"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useTheme } from "@/components/theme/ThemeToggle";

/**
 * 3D hero: a stylised daytime (light mode) skyline, amber baseline routes (long, zig-zag) vs teal AI routes (short, smooth),
 * moving vehicles and a pulsing hub. Owner: Gagandeep. Purely decorative (no real data).
 */
const AI = "#0891b2";
const BASE = "#d97706";

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

function Skyline() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 340;
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const rnd = seeded(2611);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const ang = rnd() * Math.PI * 2;
      const rad = 7 + Math.pow(rnd(), 0.7) * 26;
      const h = 0.4 + Math.pow(rnd(), 3) * 7 * (1 - rad / 48);
      const w = 0.35 + rnd() * 0.9;
      dummy.position.set(Math.cos(ang) * rad, h / 2, Math.sin(ang) * rad - 4);
      dummy.scale.set(w, h, w);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.set(rnd() > 0.78 ? "#7fb6cc" : "#b4c7da").offsetHSL(0, 0, rnd() * 0.06);
      m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.15} roughness={0.55} emissive="#0e7490" emissiveIntensity={0.04} />
    </instancedMesh>
  );
}

/** Tall tapered spire, an abstract nod to Dubai's skyline (not a model of any specific building). */
function Spire() {
  return (
    <group position={[-9, 0, -12]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 1.6 + i * 2.2, 0]}>
          <cylinderGeometry args={[0.9 - i * 0.16, 1.05 - i * 0.16, 2.3, 6]} />
          <meshStandardMaterial color="#9db8d0" metalness={0.25} roughness={0.4} emissive={AI} emissiveIntensity={0.05 + i * 0.02} />
        </mesh>
      ))}
      <mesh position={[0, 12.6, 0]}>
        <coneGeometry args={[0.12, 3.4, 6]} />
        <meshStandardMaterial color={AI} emissive={AI} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function makeCurves(kind: "ai" | "base") {
  const rnd = seeded(kind === "ai" ? 11 : 29);
  const curves: THREE.CatmullRomCurve3[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + (kind === "ai" ? 0.25 : 0.55) + rnd() * 0.3;
    const r = 8 + rnd() * 9;
    const end = new THREE.Vector3(Math.cos(ang) * r, 0.05, Math.sin(ang) * r - 2);
    const pts = [new THREE.Vector3(0, 0.05, 0)];
    if (kind === "base") {
      // zig-zag: baseline wanders
      for (let k = 1; k <= 5; k++) {
        const t = k / 6;
        pts.push(new THREE.Vector3(end.x * t + (rnd() - 0.5) * 4, 0.05, end.z * t + (rnd() - 0.5) * 4));
      }
    } else {
      pts.push(new THREE.Vector3(end.x * 0.5, 0.9, end.z * 0.5));
    }
    pts.push(end);
    curves.push(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4));
  }
  return curves;
}

function Routes({ kind }: { kind: "ai" | "base" }) {
  const curves = useMemo(() => makeCurves(kind), [kind]);
  const color = kind === "ai" ? AI : BASE;
  const vehicles = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    curves.forEach((c, i) => {
      const m = vehicles.current[i];
      if (!m) return;
      const speed = kind === "ai" ? 0.09 : 0.055;
      const u = (t * speed + i * 0.17) % 1;
      c.getPoint(u, m.position);
      m.position.y += 0.12;
    });
  });
  return (
    <group>
      {curves.map((c, i) => (
        <group key={i}>
          <Line points={c.getPoints(kind === "ai" ? 50 : 90)} color={color} lineWidth={kind === "ai" ? 3.2 : 2}
            dashed={kind === "base"} dashSize={0.5} gapSize={0.35} transparent opacity={kind === "ai" ? 1 : 0.85} />
          <mesh ref={(el) => { vehicles.current[i] = el; }}>
            <sphereGeometry args={[kind === "ai" ? 0.16 : 0.13, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Hub() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + ((clock.getElapsedTime() * 0.7) % 1) * 2.2;
    if (ring.current) {
      ring.current.scale.set(s, s, 1);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - (s - 1) / 2.2);
    }
  });
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 0.5, 24]} />
        <meshStandardMaterial color="#0e8a8a" emissive={AI} emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.6, 0.7, 48]} />
        <meshBasicMaterial color={AI} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  useFrame(({ camera, clock, pointer }) => {
    const t = clock.getElapsedTime() * 0.05;
    const r = 24;
    camera.position.x += (Math.sin(t) * r + pointer.x * 3 - camera.position.x) * 0.04;
    camera.position.z += (Math.cos(t) * r * 0.55 + 22 - camera.position.z) * 0.04;
    camera.position.y += (11 - pointer.y * 2 - camera.position.y) * 0.04;
    camera.lookAt(0, 1.6, -2);
  });
  return null;
}

export default function HeroScene() {
  const dark = useTheme() === "dark";
  const sky = dark ? "#07111f" : "#eef4fa";
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 10, 21], fov: 44 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 30, 85]} />
      <ambientLight intensity={dark ? 0.6 : 1.5} />
      <directionalLight position={[10, 18, 6]} intensity={1.6} color="#ffffff" />
      <pointLight position={[0, 3, 0]} intensity={12} color={AI} distance={16} />
      <pointLight position={[-14, 6, 10]} intensity={8} color={BASE} distance={30} />
      <gridHelper key={dark ? "g-dark" : "g-light"} args={[90, 90, dark ? "#1f3a57" : "#c3d3e4", dark ? "#14283f" : "#dbe6f1"]} position={[0, 0, 0]} />
      <Skyline />
      <Spire />
      <Routes kind="base" />
      <Routes kind="ai" />
      <Hub />
      <CameraRig />
    </Canvas>
  );
}
