"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { videos } from "@/content/videos";
import { pageLabel, type Help } from "@/lib/help";
import { GrammarBlocks } from "./GrammarBlocks";
import { Sheet } from "./Sheet";
import { VideoCard } from "./VideoCard";
import { Label, ParadigmTable, PrimaryButton, QuietButton } from "./ui";

/**
 * Help beside a question: hints one at a time, then the full rule, then the page in the book.
 * `counts`: the answer is still to come and would count towards "known".
 */
export function HelpSheet({
  help,
  counts,
  onExplain,
  onClose,
}: {
  help: Help;
  counts: boolean;
  onExplain: () => void;
  onClose: () => void;
}) {
  const [hints, setHints] = useState(help.hints.length ? 1 : 0);
  const [explained, setExplained] = useState(help.hints.length === 0);
  const explain = () => {
    setExplained(true);
    onExplain();
  };
  // With no hints to give, the sheet opens on the explanation, which then counts as read.
  const opened = useRef(onExplain);
  useEffect(() => {
    if (help.hints.length === 0) opened.current();
  }, [help]);
  const topicVideos = help.topic ? videos.filter((video) => video.topics.includes(help.topic!.id)) : [];
  return (
    <Sheet label="Help" title={help.title} onClose={onClose}>
      <div className="grid gap-4 pb-4 pt-4">
        {help.hints.slice(0, hints).map((hint, index) => (
          <div key={index} className="settle">
            <Label as="p">Hint {index + 1}</Label>
            <p className="mt-1 text-[16px] leading-relaxed">{hint}</p>
          </div>
        ))}
        {hints < help.hints.length && !explained && <QuietButton onClick={() => setHints(hints + 1)}>Next hint</QuietButton>}
        {!explained ? (
          <div className="grid gap-1.5">
            <QuietButton onClick={explain}>Show explanation</QuietButton>
            {counts && <p className="text-[15px] text-muted">After the explanation, the answer no longer counts towards &apos;known&apos;.</p>}
          </div>
        ) : (
          <div className="settle grid gap-4">
            {help.verb && help.paradigm && (
              <div className="grid gap-2">
                <ParadigmTable
                  verb={help.verb}
                  paradigm={help.paradigm}
                  title={profile.paradigms.find((paradigm) => paradigm.id === help.paradigm)?.label}
                />
                {help.verb.note && <p className="text-[15px] text-muted">{help.verb.note}</p>}
              </div>
            )}
            {help.topic && <GrammarBlocks topic={help.topic} />}
            {help.pages.length > 0 && <p className="text-[15px] text-muted">In the book: {pageLabel(help.pages)}</p>}
            {topicVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
        <PrimaryButton onClick={onClose}>Back to the exercise</PrimaryButton>
      </div>
    </Sheet>
  );
}
