"use client";
import dynamic from "next/dynamic";

/** Client-only wrapper: WebGL cannot render on the server. */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-paper" />,
});

export default function HeroCanvas() {
  return <HeroScene />;
}
