"use client";

export type PreviewText =
  | { type: "narration"; text: string }
  | { type: "dialogue"; speaker: string; text: string; speakerColor?: string }
  | { type: "thought"; text: string };

export type TextBlock =
  | { type: "narration"; text: string }
  | { type: "dialogue"; speaker: string; text: string; speakerColor?: string }
  | { type: "thought"; text: string }
  | { type: "sfx"; text: string };

export type PageContent = {
  title: string;
  image: string;
  previewText: PreviewText;
  fullPageTextBlocks: TextBlock[];
};

function NarrationBox({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute pointer-events-none z-10"
      style={style}
    >
      <div
        style={{
          background: "#FFF3B0",
          border: "2.5px solid #1a1a2e",
          borderRadius: "4px",
          padding: "8px 12px",
          maxWidth: "100%",
          boxShadow: "1px 1px 0px #1a1a2e",
        }}
      >
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "clamp(8px, 1.3vw, 14px)",
            fontWeight: 700,
            fontStyle: "italic",
            color: "#1a1a2e",
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function SpeechBubble({
  speaker,
  text,
  speakerColor,
  style,
  tailSide,
}: {
  speaker: string;
  text: string;
  speakerColor?: string;
  style?: React.CSSProperties;
  tailSide?: "left" | "right" | "center";
}) {
  const color = speakerColor || "#7B2D8B";
  const tail = tailSide || "left";

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={style}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            position: "absolute",
            top: "-14px",
            left: tail === "right" ? "auto" : "8px",
            right: tail === "right" ? "8px" : "auto",
            background: color,
            borderRadius: "4px",
            padding: "1px 8px",
            border: "2px solid #1a1a2e",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: "clamp(7px, 1vw, 11px)",
              fontWeight: 800,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {speaker}
          </span>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "2.5px solid #1a1a2e",
            borderRadius: "16px",
            padding: "8px 12px",
            paddingTop: "10px",
            maxWidth: "100%",
            position: "relative",
            boxShadow: "1px 1px 0px #1a1a2e",
          }}
        >
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "clamp(7px, 1.2vw, 13px)",
              fontWeight: 600,
              color: "#1a1a2e",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {text}
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: tail === "left" ? "14px" : tail === "center" ? "50%" : "auto",
            right: tail === "right" ? "14px" : "auto",
            transform: tail === "center" ? "translateX(-50%)" : "none",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "12px solid #1a1a2e",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-7px",
            left: tail === "left" ? "15px" : tail === "center" ? "50%" : "auto",
            right: tail === "right" ? "15px" : "auto",
            transform: tail === "center" ? "translateX(-50%)" : "none",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "10px solid #ffffff",
          }}
        />
      </div>
    </div>
  );
}

function ThoughtBubble({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute pointer-events-none z-10"
      style={style}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            background: "#ffffff",
            border: "2.5px solid #1a1a2e",
            borderRadius: "20px",
            padding: "8px 14px",
            maxWidth: "100%",
            boxShadow: "1px 1px 0px #1a1a2e",
          }}
        >
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "clamp(7px, 1.2vw, 13px)",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#1a1a2e",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {text}
          </p>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "20px",
            width: "8px",
            height: "8px",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-14px",
            left: "14px",
            width: "5px",
            height: "5px",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}

function SfxText({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="absolute pointer-events-none z-10" style={style}>
      <span
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontSize: "clamp(16px, 3vw, 30px)",
          fontWeight: 800,
          color: "#FFD166",
          textTransform: "uppercase",
          letterSpacing: "2px",
          textShadow:
            "2px 2px 0px #1a1a2e, -1px -1px 0px #1a1a2e, 1px -1px 0px #1a1a2e, -1px 1px 0px #1a1a2e",
          WebkitTextStroke: "1.5px #1a1a2e",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function PreviewOverlay({ previewText, placement }: {
  previewText: PreviewText;
  placement?: { position: React.CSSProperties; tailSide?: "left" | "right" | "center" };
}) {
  if (previewText.type === "narration") {
    return (
      <NarrationBox
        text={previewText.text}
        style={placement?.position || { bottom: "6%", left: "4%", maxWidth: "44%" }}
      />
    );
  }

  if (previewText.type === "thought") {
    return (
      <ThoughtBubble
        text={previewText.text}
        style={placement?.position || { top: "6%", right: "4%", maxWidth: "40%" }}
      />
    );
  }

  return (
    <SpeechBubble
      speaker={previewText.speaker}
      text={previewText.text}
      speakerColor={previewText.speakerColor}
      style={placement?.position || { bottom: "8%", right: "4%", maxWidth: "40%" }}
      tailSide={placement?.tailSide || "left"}
    />
  );
}

export function FullPageOverlay({
  textBlocks,
  layout,
}: {
  textBlocks: TextBlock[];
  layout?: {
    positions: React.CSSProperties[];
    tailSides?: Array<"left" | "right" | "center">;
  };
}) {
  const defaultNarrationPositions: React.CSSProperties[] = [
    { top: "4%", left: "3%", maxWidth: "40%" },
    { bottom: "4%", left: "3%", maxWidth: "42%" },
    { bottom: "4%", right: "3%", maxWidth: "40%" },
  ];
  const defaultDialoguePositions: React.CSSProperties[] = [
    { top: "10%", right: "4%", maxWidth: "38%" },
    { top: "38%", left: "4%", maxWidth: "36%" },
    { bottom: "12%", right: "4%", maxWidth: "38%" },
  ];
  const defaultDialogueTails: Array<"left" | "right" | "center"> = ["left", "right", "left"];

  let narrationIdx = 0;
  let dialogueIdx = 0;
  let blockIdx = 0;

  return (
    <>
      {textBlocks.map((block, i) => {
        const customPos = layout?.positions?.[blockIdx];
        blockIdx++;

        switch (block.type) {
          case "narration": {
            const pos = customPos || defaultNarrationPositions[narrationIdx % defaultNarrationPositions.length];
            narrationIdx++;
            return <NarrationBox key={i} text={block.text} style={pos} />;
          }
          case "dialogue": {
            const pos = customPos || defaultDialoguePositions[dialogueIdx % defaultDialoguePositions.length];
            const tail = layout?.tailSides?.[dialogueIdx] || defaultDialogueTails[dialogueIdx % defaultDialogueTails.length];
            dialogueIdx++;
            return (
              <SpeechBubble
                key={i}
                speaker={block.speaker}
                text={block.text}
                speakerColor={block.speakerColor}
                style={pos}
                tailSide={tail}
              />
            );
          }
          case "thought":
            return (
              <ThoughtBubble
                key={i}
                text={block.text}
                style={customPos || { top: "8%", left: "6%", maxWidth: "36%" }}
              />
            );
          case "sfx":
            return (
              <SfxText
                key={i}
                text={block.text}
                style={customPos || { top: "10%", right: "6%" }}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
