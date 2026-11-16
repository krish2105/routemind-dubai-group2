"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeToggle";

/**
 * 3D hero: a stylised daytime skyline, amber baseline routes (long, zig-zag) vs teal AI routes (short, smooth),
 * moving vehicles and a pulsing hub. Purely decorative (no real data). Owner: Gagandeep.
 *
 * Props
 * - view: which plan is in focus ("base" = amber baseline, "ai" = teal AI). The other plan fades back.
 * - progress: scroll progress 0..1 of the landing story; drives the camera between four shots.
 * - reduced: prefers-reduced-motion. No camera sway or orbit, vehicles parked, renders on demand only.
 * - active: false when the hero is off-screen, so the render loop stops.
 */
export type HeroView = "ai" | "base";
export interface HeroSceneProps {
  view: HeroView;
  progress?: MotionValue<number>;
  reduced?: boolean;
  active?: boolean;
}

const AI = "#0891b2";
const BASE = "#d97706";

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

/** Camera shots for the four story chapters: hero, problem, AI, result. */
const SHOTS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [0, 10, 21], look: [0, 1.6, -2] },
  { pos: [-5, 17, 27], look: [0, 0, -4] },
  { pos: [8, 6.5, 15], look: [0, 1, -2] },
  { pos: [0, 25, 10], look: [0, 0, -3] },
];
const smooth = (x: number) => x * x * (3 - 2 * x);
function shotAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const f = Math.min(Math.max(p, 0), 1) * (SHOTS.length - 1);
  const i = Math.min(Math.floor(f), SHOTS.length - 2);
  const k = smooth(f - i);
  const a = SHOTS[i], b = SHOTS[i + 1];
  pos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k, a.pos[2] + (b.pos[2] - a.pos[2]) * k);
  look.set(a.look[0] + (b.look[0] - a.look[0]) * k, a.look[1] + (b.look[1] - a.look[1]) * k, a.look[2] + (b.look[2] - a.look[2]) * k);
}

function Skyline({ dark }: { dark: boolean }) {
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
      const glassy = rnd() > 0.78;
      color.set(dark ? (glassy ? "#1f5a73" : "#1f3a57") : glassy ? "#7fb6cc" : "#b4c7da").offsetHSL(0, 0, rnd() * 0.06);
      m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [dark]);
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

function makeCurves(kind: HeroView) {
  const rnd = seeded(kind === "ai" ? 11 : 29);
  const curves: THREE.CatmullRomCurve3[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + (kind === "ai" ? 0.25 : 0.55) + rnd() * 0.3;
    const r = 8 + rnd() * 9;
    const end = new THREE.Vector3(Math.cos(ang) * r, 0.05, Math.sin(ang) * r - 2);
    const pts = [new THREE.Vector3(0, 0.05, 0)];
    if (kind === "base") {
      // zig-zag: the baseline wanders
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

type LineObj = THREE.Object3D & { material: THREE.Material & { opacity: number; linewidth?: number } };

/** One plan's routes. `focus` fades the plan in (1) or back (0); colours stay true to the legend. */
function Routes({ kind, focused, reduced }: { kind: HeroView; focused: boolean; reduced: boolean }) {
  const curves = useMemo(() => makeCurves(kind), [kind]);
  const color = kind === "ai" ? AI : BASE;
  const width = kind === "ai" ? 3.2 : 2.2;
  const lines = useRef<(LineObj | null)[]>([]);
  const vehicles = useRef<(THREE.Mesh | null)[]>([]);
  const w = useRef(focused ? 1 : 0);
  useFrame(({ clock }, delta) => {
    const target = focused ? 1 : 0;
    w.current = reduced ? target : THREE.MathUtils.damp(w.current, target, 5, delta);
    const k = w.current;
    const t = reduced ? 0 : clock.getElapsedTime();
    curves.forEach((c, i) => {
      const l = lines.current[i];
      if (l) {
        l.material.opacity = 0.12 + 0.88 * k;
        if (l.material.linewidth !== undefined) l.material.linewidth = width * (0.55 + 0.45 * k);
      }
      const m = vehicles.current[i];
      if (!m) return;
      const speed = kind === "ai" ? 0.09 : 0.055;
      const u = (t * speed + i * 0.17) % 1;
      c.getPoint(u, m.position);
      m.position.y += 0.12;
      const s = 0.4 + 0.6 * k;
      m.scale.setScalar(s);
    });
  });
  return (
    <group>
      {curves.map((c, i) => (
        <group key={i}>
          <Line
            ref={(el) => { lines.current[i] = el as unknown as LineObj | null; }}
            points={c.getPoints(kind === "ai" ? 50 : 90)}
            color={color}
            lineWidth={width}
            dashed={kind === "base"}
            dashSize={0.5}
            gapSize={0.35}
            transparent
            depthWrite={false}
          />
          <mesh ref={(el) => { vehicles.current[i] = el; }}>
            <sphereGeometry args={[kind === "ai" ? 0.16 : 0.13, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Hub({ reduced }: { reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = reduced ? 1.6 : 1 + ((clock.getElapsedTime() * 0.7) % 1) * 2.2;
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

/** Scroll picks the shot; the mouse (whole window, not just the canvas) adds a gentle parallax; a slow orbit adds life. */
function CameraRig({ progress, reduced }: { progress?: MotionValue<number>; reduced: boolean }) {
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const curLook = useRef<THREE.Vector3 | null>(null);
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);
  useFrame(({ camera, clock, size }, delta) => {
    shotAt(progress?.get() ?? 0, pos, look);
    // wide screens: slide the city to the right so the hub is not hidden behind the text panel on the left
    const aspect = size.width / size.height;
    const shift = aspect > 1.15 ? -6 : 0;
    pos.x += shift;
    look.x += shift;
    // phones (portrait): pull back so more of the city fits, and aim higher so the hub sits under the text
    if (aspect < 0.9) {
      pos.sub(look).multiplyScalar(1.6).add(look);
      look.y += 5;
    }
    if (!reduced) {
      const t = clock.getElapsedTime() * 0.06;
      pos.x += Math.sin(t) * 2.2 + mouse.current.x * 2.6;
      pos.y += -mouse.current.y * 1.4;
      pos.z += Math.cos(t) * 1.2;
    }
    if (!curLook.current) curLook.current = look.clone();
    if (reduced) {
      camera.position.copy(pos);
      curLook.current.copy(look);
    } else {
      const k = 1 - Math.exp(-4 * delta);
      camera.position.lerp(pos, k);
      curLook.current.lerp(look, k);
    }
    camera.lookAt(curLook.current);
  });
  return null;
}

/** In on-demand mode (reduced motion), redraw when the view or the scroll position changes. */
function DemandInvalidator({ progress, view }: { progress?: MotionValue<number>; view: HeroView }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => { invalidate(); }, [view, invalidate]);
  useEffect(() => progress?.on("change", () => invalidate()), [progress, invalidate]);
  return null;
}

export default function HeroScene({ view, progress, reduced = false, active = true }: HeroSceneProps) {
  const dark = useTheme() === "dark";
  const sky = dark ? "#07111f" : "#eef4fa";
  const frameloop = !active ? "never" : reduced ? "demand" : "always";
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      camera={{ position: SHOTS[0].pos, fov: 44 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 30, 85]} />
      <ambientLight intensity={dark ? 0.6 : 1.5} />
      <directionalLight position={[10, 18, 6]} intensity={1.6} color="#ffffff" />
      <pointLight position={[0, 3, 0]} intensity={12} color={AI} distance={16} />
      <pointLight position={[-14, 6, 10]} intensity={8} color={BASE} distance={30} />
      <gridHelper key={dark ? "g-dark" : "g-light"} args={[90, 90, dark ? "#1f3a57" : "#c3d3e4", dark ? "#14283f" : "#dbe6f1"]} />
      <Skyline dark={dark} />
      <Spire />
      <Routes kind="base" focused={view === "base"} reduced={reduced} />
      <Routes kind="ai" focused={view === "ai"} reduced={reduced} />
      <Hub reduced={reduced} />
      <CameraRig progress={progress} reduced={reduced} />
      <DemandInvalidator progress={progress} view={view} />
    </Canvas>
  );
}
