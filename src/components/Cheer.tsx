"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { onCheer } from "@/lib/feedback";

const COLORS = ["var(--accent)", "var(--good)", "var(--tag-1)", "var(--tag-2)", "var(--tag-3)"];
const PIECES = 16;
const LIFETIME_MS = 900;

type Piece = { color: string; dx: number; dy: number; turn: number; size: number; round: boolean };
type Burst = { id: number; pieces: Piece[] };

let nextId = 0;

function scatter(): Burst {
  const pieces = Array.from({ length: PIECES }, (_unused, index): Piece => {
    // Evenly fanned upwards and sideways, with enough randomness not to look like a clock face.
    const angle = Math.PI * (1.05 + (0.9 * index) / (PIECES - 1)) + (Math.random() - 0.5) * 0.35;
    const reach = 70 + Math.random() * 90;
    return {
      color: COLORS[index % COLORS.length],
      dx: Math.cos(angle) * reach,
      dy: Math.sin(angle) * reach,
      turn: (Math.random() - 0.5) * 540,
      size: 7 + Math.random() * 6,
      round: index % 3 === 0,
    };
  });
  return { id: nextId++, pieces };
}

/** A short burst of confetti for every right answer. Mounted once; it never takes taps. */
export function Cheer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(
    () =>
      onCheer(() => {
        const burst = scatter();
        setBursts((current) => [...current, burst]);
        setTimeout(() => setBursts((current) => current.filter((other) => other.id !== burst.id)), LIFETIME_MS);
      }),
    [],
  );

  return (
    <div className="burst pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute left-1/2 top-[34%]">
          {burst.pieces.map((piece, index) => (
            <span
              key={index}
              className="burst-piece absolute block"
              style={
                {
                  width: piece.size,
                  height: piece.round ? piece.size : piece.size * 0.55,
                  borderRadius: piece.round ? "50%" : 2,
                  background: piece.color,
                  "--dx": `${piece.dx}px`,
                  "--dy": `${piece.dy}px`,
                  "--turn": `${piece.turn}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
