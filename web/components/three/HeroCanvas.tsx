"use client";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { HeroSceneProps } from "./HeroScene";

export type { HeroView } from "./HeroScene";

/** Client-only: WebGL cannot render on the server. three.js loads in its own chunk. */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

/** Soft gradient used while three.js loads, and instead of the scene if WebGL is missing or crashes. */
export function HeroFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(40rem 26rem at 70% 40%, rgba(8,145,178,0.20), transparent 65%), radial-gradient(30rem 20rem at 30% 75%, rgba(217,119,6,0.14), transparent 60%), linear-gradient(180deg, var(--color-paper), var(--color-paper-2))",
      }}
    />
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* WebGL context or shader failure: keep the gradient, no console noise beyond React's own */ }
  render() { return this.state.failed ? <HeroFallback /> : this.props.children; }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * 3D hero wrapper: checks WebGL, pauses the render loop when the hero is off-screen,
 * and falls back to a gradient if anything fails. Pass the same props as HeroScene (minus `active`).
 */
export default function HeroCanvas(props: Omit<HeroSceneProps, "active">) {
  const box = useRef<HTMLDivElement>(null);
  const [gl, setGl] = useState<boolean | null>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => { setGl(hasWebGL()); }, []);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="absolute inset-0">
      {gl ? (
        <SceneBoundary>
          <HeroScene {...props} active={onScreen} />
        </SceneBoundary>
      ) : (
        <HeroFallback />
      )}
    </div>
  );
}
