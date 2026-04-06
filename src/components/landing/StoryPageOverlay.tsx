"use client";

export type TextBlock =
  | { type: "narration"; text: string }
  | { type: "dialogue"; speaker: string; text: string }
  | { type: "thought"; text: string }
  | { type: "sfx"; text: string };

export type StoryPageData = {
  image: string;
  textBlocks: TextBlock[];
};

function NarrationBox({ text, position }: { text: string; position: "top" | "bottom" }) {
  return (
    <div
      className={`absolute left-[4%] right-[4%] ${
        position === "top" ? "top-[3%]" : "bottom-[3%]"
      } pointer-events-none z-10`}
    >
      <div className="bg-[#1a1a2e]/85 backdrop-blur-sm border border-[#FFD166]/40 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
        <p className="font-body text-[clamp(8px,1.4vw,14px)] text-[#FFF8EE] leading-relaxed italic">
          {text}
        </p>
      </div>
    </div>
  );
}

function DialogueBubble({
  speaker,
  text,
  align,
  verticalPosition,
}: {
  speaker: string;
  text: string;
  align: "left" | "right";
  verticalPosition: string;
}) {
  return (
    <div
      className={`absolute ${
        align === "left" ? "left-[3%]" : "right-[3%]"
      } pointer-events-none z-10 max-w-[48%]`}
      style={{ top: verticalPosition }}
    >
      <div className="relative">
        <div className="bg-white/95 backdrop-blur-sm border-2 border-[#1a1a2e] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-[2px_2px_0px_rgba(26,26,46,0.4)]">
          <span className="font-heading text-[clamp(7px,1.1vw,11px)] font-extrabold text-[#7B2D8B] uppercase tracking-wider block mb-0.5">
            {speaker}
          </span>
          <p className="font-body text-[clamp(7px,1.2vw,12px)] text-[#1a1a2e] leading-snug">
            {text}
          </p>
        </div>
        <div
          className={`absolute -bottom-2 ${
            align === "left" ? "left-4" : "right-4"
          } w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/95`}
        />
      </div>
    </div>
  );
}

function ThoughtBox({ text }: { text: string }) {
  return (
    <div className="absolute left-[10%] right-[10%] top-[40%] pointer-events-none z-10">
      <div className="bg-[#7B2D8B]/70 backdrop-blur-sm border border-[#C084FC]/50 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-center">
        <p className="font-heading text-[clamp(8px,1.3vw,13px)] text-[#F3E8FF] italic leading-snug">
          {text}
        </p>
      </div>
    </div>
  );
}

function SfxText({ text }: { text: string }) {
  return (
    <div className="absolute right-[6%] top-[15%] pointer-events-none z-10">
      <span
        className="font-heading text-[clamp(14px,3vw,28px)] font-black text-[#FFD166] uppercase tracking-wider drop-shadow-lg"
        style={{
          textShadow:
            "2px 2px 0px #1a1a2e, -1px -1px 0px #1a1a2e, 1px -1px 0px #1a1a2e, -1px 1px 0px #1a1a2e",
          WebkitTextStroke: "1px #1a1a2e",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function StoryPageOverlay({ textBlocks }: { textBlocks: TextBlock[] }) {
  let dialogueIndex = 0;
  const dialoguePositions = ["28%", "55%", "72%"];
  let hasTopNarration = false;

  return (
    <>
      {textBlocks.map((block, i) => {
        switch (block.type) {
          case "narration": {
            const pos = hasTopNarration ? "bottom" : "top";
            hasTopNarration = true;
            return <NarrationBox key={i} text={block.text} position={pos} />;
          }
          case "dialogue": {
            const align = dialogueIndex % 2 === 0 ? "left" : "right";
            const vPos = dialoguePositions[dialogueIndex % dialoguePositions.length];
            dialogueIndex++;
            return (
              <DialogueBubble
                key={i}
                speaker={block.speaker}
                text={block.text}
                align={align as "left" | "right"}
                verticalPosition={vPos}
              />
            );
          }
          case "thought":
            return <ThoughtBox key={i} text={block.text} />;
          case "sfx":
            return <SfxText key={i} text={block.text} />;
          default:
            return null;
        }
      })}
    </>
  );
}
