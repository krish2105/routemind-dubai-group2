"use client";
import { useEffect, useRef, useState } from "react";
import { hhmm } from "./trips";

/** 08:00 to 20:00 playback clock for the route map (owner: Krishna). */
export const DAY_START = 8 * 60;
export const DAY_END = 20 * 60;

export function usePlayback(minutesPerSecond = 20) {
  const [time, setTime] = useState(DAY_START);
  const [playing, setPlaying] = useState(false);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) { last.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((t) => {
        const next = t + dt * minutesPerSecond;
        if (next >= DAY_END) { setPlaying(false); return DAY_END; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, minutesPerSecond]);
  return { time, setTime, playing, setPlaying };
}

export function TimeScrubber({ time, setTime, playing, setPlaying, marker }: ReturnType<typeof usePlayback> & { marker?: { at: number; label: string } }) {
  const pct = (m: number) => ((m - DAY_START) / (DAY_END - DAY_START)) * 100;
  return (
    <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3">
      <button
        type="button"
        onClick={() => { if (time >= DAY_END) setTime(DAY_START); setPlaying(!playing); }}
        className="rounded-xl bg-ai px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <div className="num w-14 text-lg text-fg">{hhmm(time)}</div>
      <div className="relative flex-1">
        <input
          type="range" min={DAY_START} max={DAY_END} step={1} value={time}
          onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); }}
          className="w-full accent-[var(--color-ai)]" aria-label="Time of day"
        />
        {marker && (
          <div className="pointer-events-none absolute -top-4 text-[10px] font-medium text-risk" style={{ left: `calc(${pct(marker.at)}% - 14px)` }}>
            ▼ {marker.label}
          </div>
        )}
        <div className="mt-0.5 flex justify-between text-[10px] text-slate-500"><span>08:00</span><span>14:00</span><span>20:00</span></div>
      </div>
    </div>
  );
}
