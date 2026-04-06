"use client";

export type PreviewText =
  | { type: "narration"; text: string }
  | { type: "dialogue"; speaker: string; text: string };

export type TextBlock =
  | { type: "narration"; text: string }
  | { type: "dialogue"; speaker: string; text: string }
  | { type: "thought"; text: string }
  | { type: "sfx"; text: string };

export type PageContent = {
  title: string;
  image: string;
  previewText: PreviewText;
  fullPageTextBlocks: TextBlock[];
};

function CaptionBox({ text, position }: { text: string; position?: { bottom?: string; left?: string; right?: string; top?: string } }) {
  const pos = position || { bottom: "8%", left: "6%" };
  return (
    <div
      className="absolute pointer-events-none z-10 max-w-[42%]"
      style={pos}
    >
      <div
        className="rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2"
        style={{
          background: "rgba(255, 252, 240, 0.88)",
          boxShadow: "0 1px 8px rgba(26,26,46,0.12)",
          border: "1.5px solid rgba(26,26,46,0.10)",
        }}
      >
        <p className="font-body text-[clamp(7px,1.2vw,12px)] text-[#2a2a3e] leading-snug italic">
          {text}
        </p>
      </div>
    </div>
  );
}

function SpeechBubble({
  speaker,
  text,
  position,
  tailDirection,
}: {
  speaker: string;
  text: string;
  position?: { bottom?: string; left?: string; right?: string; top?: string };
  tailDirection?: "left" | "right" | "center";
}) {
  const pos = position || { bottom: "6%", right: "6%" };
  const tail = tailDirection || "center";

  const tailPos =
    tail === "left" ? "left-3" : tail === "right" ? "right-3" : "left-1/2 -translate-x-1/2";

  return (
    <div
      className="absolute pointer-events-none z-10 max-w-[40%]"
      style={pos}
    >
      <div className="relative">
        <div
          className="rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2"
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 2px 10px rgba(26,26,46,0.12)",
            border: "1.5px solid rgba(26,26,46,0.12)",
          }}
        >
          <span className="font-heading text-[clamp(6px,0.9vw,9px)] font-bold text-[#7B2D8B] uppercase tracking-wide block mb-0.5 opacity-80">
            {speaker}
          </span>
          <p className="font-body text-[clamp(7px,1.15vw,12px)] text-[#1a1a2e] leading-snug">
            &ldquo;{text}&rdquo;
          </p>
        </div>
        <div
          className={`absolute -bottom-[6px] ${tailPos} w-0 h-0`}
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "7px solid rgba(255, 255, 255, 0.94)",
            filter: "drop-shadow(0 1px 1px rgba(26,26,46,0.08))",
          }}
        />
      </div>
    </div>
  );
}

function FullCaptionBox({ text, position }: { text: string; position: { bottom?: string; left?: string; right?: string; top?: string } }) {
  return (
    <div
      className="absolute pointer-events-none z-10 max-w-[44%]"
      style={position}
    >
      <div
        className="rounded-md px-3 py-2 sm:px-4 sm:py-2.5"
        style={{
          background: "rgba(255, 252, 240, 0.90)",
          boxShadow: "0 1px 10px rgba(26,26,46,0.14)",
          border: "1.5px solid rgba(26,26,46,0.10)",
        }}
      >
        <p className="font-body text-[clamp(8px,1.4vw,14px)] text-[#2a2a3e] leading-relaxed italic">
          {text}
        </p>
      </div>
    </div>
  );
}

function FullSpeechBubble({
  speaker,
  text,
  position,
  tailDirection,
}: {
  speaker: string;
  text: string;
  position: { bottom?: string; left?: string; right?: string; top?: string };
  tailDirection?: "left" | "right" | "center";
}) {
  const tail = tailDirection || "center";
  const tailPos =
    tail === "left" ? "left-3" : tail === "right" ? "right-3" : "left-1/2 -translate-x-1/2";

  return (
    <div
      className="absolute pointer-events-none z-10 max-w-[42%]"
      style={position}
    >
      <div className="relative">
        <div
          className="rounded-xl px-3 py-2 sm:px-4 sm:py-2.5"
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 2px 12px rgba(26,26,46,0.12)",
            border: "1.5px solid rgba(26,26,46,0.12)",
          }}
        >
          <span className="font-heading text-[clamp(7px,1vw,10px)] font-bold text-[#7B2D8B] uppercase tracking-wide block mb-0.5 opacity-80">
            {speaker}
          </span>
          <p className="font-body text-[clamp(8px,1.3vw,13px)] text-[#1a1a2e] leading-snug">
            &ldquo;{text}&rdquo;
          </p>
        </div>
        <div
          className={`absolute -bottom-[7px] ${tailPos} w-0 h-0`}
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid rgba(255, 255, 255, 0.94)",
            filter: "drop-shadow(0 1px 1px rgba(26,26,46,0.08))",
          }}
        />
      </div>
    </div>
  );
}

function FullThoughtBox({ text, position }: { text: string; position: { bottom?: string; left?: string; right?: string; top?: string } }) {
  return (
    <div
      className="absolute pointer-events-none z-10 max-w-[38%]"
      style={position}
    >
      <div
        className="rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-center"
        style={{
          background: "rgba(243, 232, 255, 0.85)",
          boxShadow: "0 1px 8px rgba(123,45,139,0.10)",
          border: "1.5px solid rgba(192, 132, 252, 0.3)",
        }}
      >
        <p className="font-body text-[clamp(8px,1.2vw,13px)] text-[#4a1d6b] italic leading-snug">
          {text}
        </p>
      </div>
    </div>
  );
}

function FullSfxText({ text, position }: { text: string; position: { bottom?: string; left?: string; right?: string; top?: string } }) {
  return (
    <div className="absolute pointer-events-none z-10" style={position}>
      <span
        className="font-heading text-[clamp(14px,2.8vw,26px)] font-black text-[#FFD166] uppercase tracking-wider"
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

export function PreviewOverlay({ previewText }: { previewText: PreviewText }) {
  if (previewText.type === "narration") {
    return <CaptionBox text={previewText.text} position={{ bottom: "8%", left: "6%" }} />;
  }

  return (
    <SpeechBubble
      speaker={previewText.speaker}
      text={previewText.text}
      position={{ bottom: "8%", right: "6%" }}
      tailDirection="right"
    />
  );
}

export function FullPageOverlay({ textBlocks }: { textBlocks: TextBlock[] }) {
  const narrationPositions = [
    { top: "5%", left: "5%" },
    { bottom: "5%", left: "5%" },
  ];
  const dialoguePositions = [
    { top: "8%", right: "5%" },
    { bottom: "10%", right: "5%" },
    { bottom: "8%", left: "5%" },
  ];
  const thoughtPosition = { bottom: "35%", left: "8%" };
  const sfxPosition = { top: "12%", right: "8%" };

  let narrationIdx = 0;
  let dialogueIdx = 0;

  return (
    <>
      {textBlocks.map((block, i) => {
        switch (block.type) {
          case "narration": {
            const pos = narrationPositions[narrationIdx % narrationPositions.length];
            narrationIdx++;
            return <FullCaptionBox key={i} text={block.text} position={pos} />;
          }
          case "dialogue": {
            const pos = dialoguePositions[dialogueIdx % dialoguePositions.length];
            const tails: Array<"left" | "right"> = ["right", "right", "left"];
            const tail = tails[dialogueIdx % tails.length];
            dialogueIdx++;
            return (
              <FullSpeechBubble
                key={i}
                speaker={block.speaker}
                text={block.text}
                position={pos}
                tailDirection={tail}
              />
            );
          }
          case "thought":
            return <FullThoughtBox key={i} text={block.text} position={thoughtPosition} />;
          case "sfx":
            return <FullSfxText key={i} text={block.text} position={sfxPosition} />;
          default:
            return null;
        }
      })}
    </>
  );
}
