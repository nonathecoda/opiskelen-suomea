"use client";

import { useState } from "react";
import type { Video } from "@/content/videos";

/** A video: a framed face with a play button; the player loads only when asked for. */
export function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="grid gap-2">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-edge bg-surface" style={{ minHeight: video.minHeight }}>
        {playing && video.embeddable ? (
          <iframe
            src={video.embed}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => (video.embeddable ? setPlaying(true) : window.open(video.url, "_blank", "noopener"))}
            className="press absolute inset-0 grid place-items-center"
          >
            <span className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[17px] font-semibold text-accent-ink">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M7 4l13 8-13 8z" />
              </svg>
              Watch video
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex items-baseline gap-3">
        <span className="flex-1 text-[16px] font-medium leading-snug">{video.title}</span>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="link min-h-11 text-[15px]">
          Open
        </a>
      </figcaption>
      {video.needs && <p className="text-[14px] text-muted">{video.needs}</p>}
    </figure>
  );
}
