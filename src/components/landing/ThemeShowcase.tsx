"use client";

import { useRef } from "react";
import Link from "next/link";
import { Theme } from "@/types/theme";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ── Realistic 3D Theme card SVG illustrations ── */

function SpaceIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="space-bg" x1="0" y1="0" x2="300" y2="128">
          <stop stopColor="#020617" /><stop offset="0.5" stopColor="#1E1B4B" /><stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <radialGradient id="planetGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <radialGradient id="rocketNose" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <radialGradient id="moonSurface" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#CA8A04" />
        </radialGradient>
        <filter id="spaceGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="300" height="128" fill="url(#space-bg)" />
      {/* Nebula clouds */}
      <ellipse cx="250" cy="90" rx="80" ry="40" fill="#7C3AED" opacity="0.06" />
      <ellipse cx="80" cy="30" rx="60" ry="30" fill="#3B82F6" opacity="0.05" />
      {/* Stars with twinkle effect */}
      {[[20,20,1.5],[55,42,1],[90,12,2],[140,35,1.2],[200,18,1.8],[250,48,1.5],[280,12,2],[35,82,1],[160,92,1.5],[272,78,1]].map(([x,y,r],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) * 2.5} fill="white" opacity="0.02" />
          <circle cx={x} cy={y} r={r as number} fill="white" opacity={0.4 + (i%3)*0.2} />
          {(r as number) > 1.5 && (
            <>
              <line x1={(x as number)-(r as number)} y1={y} x2={(x as number)+(r as number)} y2={y} stroke="white" strokeWidth="0.3" opacity="0.15" />
              <line x1={x} y1={(y as number)-(r as number)} x2={x} y2={(y as number)+(r as number)} stroke="white" strokeWidth="0.3" opacity="0.15" />
            </>
          )}
        </g>
      ))}
      {/* Planet with 3D shading and rings */}
      <circle cx="230" cy="50" r="24" fill="url(#planetGrad)" />
      <circle cx="222" cy="42" r="6" fill="white" opacity="0.12" />
      <ellipse cx="230" cy="50" rx="38" ry="7" fill="none" stroke="#DDD6FE" strokeWidth="2.5" opacity="0.4" transform="rotate(-15,230,50)" />
      <ellipse cx="230" cy="50" rx="38" ry="7" fill="none" stroke="#C4B5FD" strokeWidth="1" opacity="0.2" transform="rotate(-15,230,50)" />
      {/* Planet shadow */}
      <circle cx="238" cy="56" r="22" fill="#1E1B4B" opacity="0.3" />
      {/* Rocket with 3D metallic look */}
      <g transform="translate(105,32) rotate(-30)">
        <ellipse cx="0" cy="0" rx="9" ry="20" fill="url(#rocketBody)" />
        <ellipse cx="-3" cy="0" rx="2" ry="18" fill="white" opacity="0.2" />
        <ellipse cx="0" cy="-16" rx="5" ry="7" fill="url(#rocketNose)" />
        <rect x="-11" y="8" width="7" height="9" rx="2" fill="#3B82F6" />
        <rect x="4" y="8" width="7" height="9" rx="2" fill="#2563EB" />
        <circle cx="0" cy="0" r="4" fill="#1E3A5F" />
        <circle cx="0" cy="0" r="3" fill="#BFDBFE" />
        <circle cx="-1" cy="-1" r="1" fill="white" opacity="0.5" />
        {/* Flame with glow */}
        <ellipse cx="0" cy="20" rx="5" ry="8" fill="#F97316" opacity="0.8" />
        <ellipse cx="0" cy="22" rx="3" ry="6" fill="#FBBF24" opacity="0.9" />
        <ellipse cx="0" cy="24" rx="1.5" ry="4" fill="#FEF3C7" />
        <ellipse cx="0" cy="20" rx="7" ry="10" fill="#F97316" opacity="0.1" />
      </g>
      {/* Moon with 3D craters */}
      <circle cx="48" cy="92" r="16" fill="url(#moonSurface)" />
      <circle cx="42" cy="86" r="4" fill="white" opacity="0.12" />
      <circle cx="44" cy="88" r="4" fill="#A16207" opacity="0.15" />
      <circle cx="52" cy="96" r="2.5" fill="#A16207" opacity="0.12" />
      <circle cx="40" cy="96" r="2" fill="#A16207" opacity="0.1" />
    </svg>
  );
}

function DinoIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="dino-bg" x1="0" y1="0" x2="0" y2="128">
          <stop stopColor="#065F46" /><stop offset="0.5" stopColor="#047857" /><stop offset="1" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="dinoBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="volcanoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id="lavaGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
        <linearGradient id="palmTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="50%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <rect width="300" height="128" fill="url(#dino-bg)" />
      {/* Atmospheric fog */}
      <ellipse cx="150" cy="128" rx="200" ry="20" fill="#86EFAC" opacity="0.08" />
      {/* Volcano with 3D shading */}
      <polygon points="225,128 258,35 295,128" fill="url(#volcanoGrad)" />
      <polygon points="258,35 276,80 295,128 258,128" fill="#78350F" opacity="0.3" />
      {/* Lava */}
      <ellipse cx="258" cy="38" rx="8" ry="5" fill="url(#lavaGlow)" opacity="0.8" />
      <circle cx="258" cy="36" r="4" fill="#FDE68A" opacity="0.5" />
      {/* Lava drip */}
      <path d="M255,42 Q254,55 256,65" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Palm trees with 3D trunks */}
      <rect x="38" y="75" width="7" height="40" rx="3" fill="url(#palmTrunk)" />
      <path d="M42,75 Q30,65 18,72" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
      <path d="M42,75 Q52,62 64,68" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
      <path d="M42,75 Q40,60 38,52" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <rect x="68" y="82" width="5" height="32" rx="2" fill="url(#palmTrunk)" />
      <path d="M71,82 Q62,74 54,78" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M71,82 Q78,72 86,76" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      {/* Dinosaur with 3D volume */}
      <ellipse cx="160" cy="88" rx="32" ry="22" fill="url(#dinoBody)" />
      {/* Belly highlight */}
      <ellipse cx="158" cy="92" rx="22" ry="14" fill="#86EFAC" opacity="0.25" />
      {/* Neck with 3D curve */}
      <path d="M138,78 Q122,48 128,32" stroke="url(#dinoBody)" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M133,75 Q120,50 124,35" stroke="#4ADE80" strokeWidth="4" fill="none" opacity="0.2" />
      {/* Head */}
      <ellipse cx="128" cy="28" rx="14" ry="10" fill="#22C55E" />
      <ellipse cx="126" cy="26" rx="10" ry="7" fill="#4ADE80" opacity="0.3" />
      {/* Eye with depth */}
      <circle cx="122" cy="25" r="4" fill="white" />
      <circle cx="123" cy="25" r="2.5" fill="#1F2937" />
      <circle cx="122" cy="24" r="1" fill="white" opacity="0.7" />
      {/* Smile */}
      <path d="M118,32 Q123,37 128,32" stroke="#15803D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Spots on body */}
      <circle cx="150" cy="82" r="4" fill="#16A34A" opacity="0.3" />
      <circle cx="168" cy="86" r="3" fill="#16A34A" opacity="0.25" />
      <circle cx="155" cy="94" r="3.5" fill="#16A34A" opacity="0.2" />
      {/* Tail with 3D shape */}
      <path d="M192,86 Q212,76 222,88 Q230,100 216,106" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M192,86 Q210,78 220,90" stroke="#4ADE80" strokeWidth="4" fill="none" opacity="0.2" />
      {/* Legs with volume */}
      <rect x="143" y="105" width="10" height="20" rx="5" fill="#16A34A" />
      <rect x="145" y="106" width="3" height="18" rx="2" fill="#22C55E" opacity="0.3" />
      <rect x="167" y="105" width="10" height="20" rx="5" fill="#16A34A" />
      <rect x="169" y="106" width="3" height="18" rx="2" fill="#22C55E" opacity="0.3" />
      {/* Dino shadow */}
      <ellipse cx="160" cy="125" rx="35" ry="5" fill="black" opacity="0.1" />
      {/* Ground */}
      <ellipse cx="150" cy="135" rx="160" ry="18" fill="#86EFAC" opacity="0.15" />
      {/* Eggs with 3D shading */}
      <ellipse cx="200" cy="114" rx="7" ry="10" fill="#FEF3C7" />
      <ellipse cx="197" cy="110" rx="3" ry="5" fill="white" opacity="0.2" />
      <ellipse cx="214" cy="116" rx="6" ry="8" fill="#FDE68A" />
      <ellipse cx="212" cy="113" rx="2.5" ry="4" fill="white" opacity="0.15" />
    </svg>
  );
}

function OceanIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="ocean-bg" x1="0" y1="0" x2="0" y2="128">
          <stop stopColor="#0EA5E9" /><stop offset="0.5" stopColor="#0284C7" /><stop offset="1" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="fishBody1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="fishBody2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="chestGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" opacity="0.4" />
          <stop offset="100%" stopColor="#D97706" opacity="0.2" />
        </linearGradient>
        <filter id="underwater">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      <rect width="300" height="128" fill="url(#ocean-bg)" />
      {/* Light rays from surface */}
      <polygon points="80,0 100,128 60,128" fill="white" opacity="0.03" />
      <polygon points="160,0 180,128 140,128" fill="white" opacity="0.04" />
      <polygon points="230,0 255,128 215,128" fill="white" opacity="0.03" />
      {/* Bubbles with 3D glass effect */}
      {[[30,22,5],[60,52,3.5],[250,28,6],[270,72,4],[140,18,3],[200,82,5],[100,75,3],[180,40,4]].map(([x,y,r],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r as number} fill="white" opacity={0.08 + (i%3)*0.03} />
          <circle cx={x} cy={y} r={r as number} fill="none" stroke="white" strokeWidth="0.5" opacity="0.15" />
          <circle cx={(x as number) - (r as number)*0.3} cy={(y as number) - (r as number)*0.3} r={(r as number)*0.25} fill="white" opacity="0.2" />
        </g>
      ))}
      {/* Seaweed with 3D depth */}
      <path d="M18,128 Q24,100 18,78 Q12,56 20,38" stroke="#22C55E" strokeWidth="5" fill="none" opacity="0.5" />
      <path d="M20,128 Q26,102 20,80 Q14,58 22,40" stroke="#4ADE80" strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M30,128 Q36,108 30,90 Q24,72 32,52" stroke="#16A34A" strokeWidth="4" fill="none" opacity="0.4" />
      <path d="M270,128 Q276,100 270,78 Q264,60 272,48" stroke="#22C55E" strokeWidth="5" fill="none" opacity="0.4" />
      <path d="M282,128 Q286,108 282,92" stroke="#16A34A" strokeWidth="3" fill="none" opacity="0.3" />
      {/* Main fish with 3D body */}
      <g transform="translate(120,55)">
        <ellipse cx="0" cy="0" rx="17" ry="11" fill="url(#fishBody1)" />
        <ellipse cx="-4" cy="-2" rx="8" ry="6" fill="#FDBA74" opacity="0.4" />
        <polygon points="-17,0 -28,-9 -28,9" fill="#EA580C" />
        <polygon points="-17,0 -28,-9 -22,0" fill="#FDBA74" opacity="0.3" />
        {/* Scales hint */}
        <path d="M-5,2 Q-2,0 -5,-2" stroke="#C2410C" strokeWidth="0.5" fill="none" opacity="0.3" />
        <path d="M0,3 Q3,1 0,-1" stroke="#C2410C" strokeWidth="0.5" fill="none" opacity="0.25" />
        {/* Eye */}
        <circle cx="9" cy="-2" r="4" fill="white" />
        <circle cx="10" cy="-2" r="2" fill="#1F2937" />
        <circle cx="9" cy="-3" r="0.8" fill="white" opacity="0.8" />
        {/* Mouth */}
        <path d="M14,2 Q16,4 14,5" stroke="#C2410C" strokeWidth="0.8" fill="none" />
        {/* Fin */}
        <path d="M-2,-10 Q2,-16 6,-10" fill="#FB923C" opacity="0.7" />
      </g>
      {/* Smaller fish */}
      <g transform="translate(200,32) scale(0.75)">
        <ellipse cx="0" cy="0" rx="14" ry="9" fill="url(#fishBody2)" />
        <ellipse cx="-3" cy="-1" rx="7" ry="5" fill="#93C5FD" opacity="0.3" />
        <polygon points="-14,0 -22,-7 -22,7" fill="#2563EB" />
        <circle cx="6" cy="-1" r="3" fill="white" />
        <circle cx="7" cy="-1" r="1.5" fill="#1F2937" />
        <circle cx="6" cy="-2" r="0.6" fill="white" opacity="0.7" />
      </g>
      {/* Treasure chest with 3D */}
      <rect x="138" y="99" width="28" height="18" rx="3" fill="url(#chestGrad)" />
      <rect x="136" y="95" width="32" height="10" rx="3" fill="#B45309" />
      <rect x="136" y="95" width="32" height="3" fill="#D97706" opacity="0.4" />
      <circle cx="152" cy="108" r="3.5" fill="#FBBF24" />
      <circle cx="151" cy="107" r="1.5" fill="#FEF3C7" opacity="0.5" />
      {/* Gold coins spilling */}
      <circle cx="168" cy="112" r="3" fill="#FBBF24" opacity="0.6" />
      <circle cx="172" cy="114" r="2.5" fill="#F59E0B" opacity="0.5" />
      {/* Starfish with 3D */}
      <polygon points="80,110 83,102 91,102 86,108 88,116 80,111 72,116 74,108 69,102 77,102" fill="#F472B6" />
      <polygon points="80,110 82,105 86,105 83,109 84,113 80,111 76,113 77,109 74,105 78,105" fill="#FBCFE8" opacity="0.3" />
      {/* Coral with 3D branches */}
      <path d="M238,128 Q240,114 236,106" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M244,128 Q248,112 244,102" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M250,128 Q248,116 252,108" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* Sandy bottom with texture */}
      <path d="M0,124 Q40,118 80,122 Q120,126 160,120 Q200,114 240,122 Q280,128 300,118 L300,128 L0,128 Z" fill="url(#sandGrad)" />
      <circle cx="60" cy="124" r="1" fill="#D97706" opacity="0.15" />
      <circle cx="120" cy="122" r="1.5" fill="#D97706" opacity="0.1" />
      <circle cx="200" cy="120" r="1" fill="#D97706" opacity="0.12" />
    </svg>
  );
}

function CastleIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="castle-bg" x1="0" y1="0" x2="0" y2="128">
          <stop stopColor="#3B0764" /><stop offset="0.5" stopColor="#581C87" /><stop offset="1" stopColor="#7E22CE" />
        </linearGradient>
        <linearGradient id="castleWall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D8B4FE" />
          <stop offset="50%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="40%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="gateGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="100%" stopColor="#2E1065" />
        </linearGradient>
        <radialGradient id="windowLight" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" opacity="0.6" />
        </radialGradient>
      </defs>
      <rect width="300" height="128" fill="url(#castle-bg)" />
      {/* Stars with twinkling */}
      {[[25,12,1.5],[72,22,1],[175,8,1.8],[222,18,1.2],[268,28,1.5],[130,5,1]].map(([x,y,r],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number)*2} fill="white" opacity="0.03" />
          <circle cx={x} cy={y} r={r as number} fill="white" opacity={0.3 + i*0.08} />
        </g>
      ))}
      {/* Castle with 3D depth */}
      {/* Main wall */}
      <rect x="108" y="42" width="84" height="74" fill="url(#castleWall)" />
      <rect x="110" y="44" width="20" height="70" fill="white" opacity="0.08" />
      {/* Towers with 3D shading */}
      <rect x="96" y="26" width="28" height="90" fill="url(#towerGrad)" />
      <rect x="98" y="28" width="6" height="86" fill="white" opacity="0.1" />
      <rect x="176" y="26" width="28" height="90" fill="url(#towerGrad)" />
      <rect x="178" y="28" width="6" height="86" fill="white" opacity="0.1" />
      {/* Tower roofs (conical) */}
      <polygon points="95,26 110,6 125,26" fill="#7C3AED" />
      <polygon points="95,26 110,6 110,26" fill="#6D28D9" opacity="0.3" />
      <polygon points="175,26 190,6 205,26" fill="#7C3AED" />
      <polygon points="175,26 190,6 190,26" fill="#6D28D9" opacity="0.3" />
      {/* Battlements with depth */}
      {[96,106,116].map(x => (
        <g key={`bl-${x}`}>
          <rect x={x} y="22" width="6" height="8" fill="#C4B5FD" />
          <rect x={x} y="22" width="2" height="8" fill="white" opacity="0.1" />
        </g>
      ))}
      {[176,186,196].map(x => (
        <g key={`br-${x}`}>
          <rect x={x} y="22" width="6" height="8" fill="#C4B5FD" />
          <rect x={x} y="22" width="2" height="8" fill="white" opacity="0.1" />
        </g>
      ))}
      {[115,128,141,154,167].map(x => (
        <g key={`bm-${x}`}>
          <rect x={x} y="37" width="6" height="8" fill="#C4B5FD" />
          <rect x={x} y="37" width="2" height="8" fill="white" opacity="0.08" />
        </g>
      ))}
      {/* Gate with 3D arch */}
      <path d="M136,116 L136,85 Q150,73 164,85 L164,116" fill="url(#gateGrad)" />
      <path d="M138,114 L138,87 Q150,77 162,87 L162,114" fill="#1E1B4B" opacity="0.3" />
      {/* Gate grate lines */}
      <line x1="146" y1="85" x2="146" y2="116" stroke="#6D28D9" strokeWidth="1" opacity="0.3" />
      <line x1="154" y1="85" x2="154" y2="116" stroke="#6D28D9" strokeWidth="1" opacity="0.3" />
      {/* Windows with warm glow */}
      <rect x="116" y="58" width="11" height="16" rx="5.5" fill="url(#windowLight)" />
      <circle cx="121" cy="64" r="8" fill="#FDE68A" opacity="0.08" />
      <rect x="173" y="58" width="11" height="16" rx="5.5" fill="url(#windowLight)" />
      <circle cx="178" cy="64" r="8" fill="#FDE68A" opacity="0.08" />
      {/* Flag with 3D fabric */}
      <line x1="150" y1="22" x2="150" y2="0" stroke="#78716C" strokeWidth="2" />
      <polygon points="150,2 172,9 150,16" fill="#DC2626" />
      <polygon points="150,2 172,9 150,9" fill="#EF4444" opacity="0.4" />
      <circle cx="150" cy="0" r="2" fill="#FBBF24" />
      {/* Enchanted forest with 3D trees */}
      <circle cx="48" cy="96" r="22" fill="#15803D" opacity="0.7" />
      <circle cx="34" cy="102" r="16" fill="#166534" opacity="0.6" />
      <circle cx="58" cy="92" r="14" fill="#22C55E" opacity="0.4" />
      <circle cx="262" cy="92" r="24" fill="#15803D" opacity="0.7" />
      <circle cx="280" cy="100" r="16" fill="#166534" opacity="0.6" />
      <circle cx="252" cy="88" r="12" fill="#22C55E" opacity="0.4" />
      {/* Path with perspective */}
      <path d="M150,128 Q148,122 152,118 Q148,115 150,116" stroke="#FDE68A" strokeWidth="10" opacity="0.2" strokeLinecap="round" />
      <path d="M150,128 Q148,122 152,118" stroke="#FEF3C7" strokeWidth="4" opacity="0.15" strokeLinecap="round" />
      {/* Ground */}
      <rect x="0" y="115" width="300" height="13" fill="#22C55E" opacity="0.25" />
    </svg>
  );
}

function SuperheroIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="0" y2="128">
          <stop stopColor="#7F1D1D" /><stop offset="0.5" stopColor="#DC2626" /><stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id="heroSuit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="capeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <radialGradient id="sunBurst" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="30%" stopColor="#FBBF24" opacity="0.5" />
          <stop offset="100%" stopColor="#FBBF24" opacity="0" />
        </radialGradient>
        <linearGradient id="building1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="300" height="128" fill="url(#hero-bg)" />
      {/* City skyline with 3D buildings */}
      <g>
        <rect x="8" y="68" width="28" height="60" fill="url(#building1)" opacity="0.7" />
        <rect x="10" y="70" width="4" height="4" fill="#FBBF24" opacity="0.5" />
        <rect x="18" y="76" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="10" y="84" width="4" height="4" fill="#FBBF24" opacity="0.3" />
        <rect x="26" y="82" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="38" y="52" width="32" height="76" fill="url(#building1)" opacity="0.6" />
        <rect x="40" y="54" width="28" height="3" fill="white" opacity="0.05" />
        <rect x="42" y="60" width="4" height="4" fill="#FBBF24" opacity="0.5" />
        <rect x="52" y="68" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="42" y="76" width="4" height="4" fill="#FBBF24" opacity="0.3" />
        <rect x="58" y="58" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="228" y="58" width="30" height="70" fill="url(#building1)" opacity="0.6" />
        <rect x="230" y="60" width="26" height="3" fill="white" opacity="0.05" />
        <rect x="232" y="66" width="4" height="4" fill="#FBBF24" opacity="0.5" />
        <rect x="248" y="74" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="264" y="72" width="28" height="56" fill="url(#building1)" opacity="0.7" />
        <rect x="268" y="78" width="4" height="4" fill="#FBBF24" opacity="0.4" />
        <rect x="278" y="86" width="4" height="4" fill="#FBBF24" opacity="0.3" />
      </g>
      {/* Sun burst with 3D glow */}
      <circle cx="150" cy="28" r="28" fill="url(#sunBurst)" />
      <circle cx="150" cy="28" r="14" fill="#FBBF24" opacity="0.4" />
      <circle cx="150" cy="28" r="8" fill="#FEF3C7" opacity="0.5" />
      {/* Hero child with 3D shading */}
      <g>
        {/* Cape with flow and 3D */}
        <path d="M140,64 Q126,82 122,112" fill="url(#capeGrad)" opacity="0.85" />
        <path d="M140,64 Q130,82 128,112" fill="#DC2626" opacity="0.4" />
        <path d="M160,64 Q174,82 178,112" fill="url(#capeGrad)" opacity="0.85" />
        <path d="M160,64 Q170,82 172,112" fill="#DC2626" opacity="0.4" />
        {/* Head with 3D */}
        <circle cx="150" cy="52" r="12" fill="#FED7AA" />
        <circle cx="146" cy="48" r="4" fill="white" opacity="0.1" />
        {/* Mask with 3D */}
        <path d="M138,50 Q144,46 150,48 Q156,46 162,50 L160,54 L140,54 Z" fill="url(#heroSuit)" />
        <path d="M140,51 Q145,48 150,50" fill="#60A5FA" opacity="0.3" />
        {/* Eyes */}
        <circle cx="144" cy="51" r="2.5" fill="white" />
        <circle cx="156" cy="51" r="2.5" fill="white" />
        <circle cx="145" cy="51" r="1.2" fill="#1F2937" />
        <circle cx="157" cy="51" r="1.2" fill="#1F2937" />
        <circle cx="144" cy="50" r="0.5" fill="white" />
        <circle cx="156" cy="50" r="0.5" fill="white" />
        {/* Determined smile */}
        <path d="M146,58 Q150,62 154,58" stroke="#92400E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Body with 3D suit */}
        <rect x="142" y="64" width="16" height="24" rx="5" fill="url(#heroSuit)" />
        <rect x="144" y="66" width="4" height="20" fill="#60A5FA" opacity="0.2" />
        {/* Star emblem on chest */}
        <polygon points="150,68 151.5,72 155.5,72 152.5,74.5 153.5,78.5 150,76 146.5,78.5 147.5,74.5 144.5,72 148.5,72" fill="#FBBF24" />
        {/* Belt with 3D */}
        <rect x="141" y="80" width="18" height="5" rx="2" fill="#FBBF24" />
        <rect x="141" y="80" width="18" height="2" fill="#FDE68A" opacity="0.4" />
        <rect x="148" y="79" width="4" height="7" rx="1" fill="#F59E0B" />
        {/* Arms - power pose */}
        <line x1="142" y1="70" x2="128" y2="58" stroke="#FED7AA" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="158" y1="70" x2="172" y2="58" stroke="#FED7AA" strokeWidth="5.5" strokeLinecap="round" />
        {/* Gloves */}
        <circle cx="126" cy="56" r="4.5" fill="#DC2626" />
        <circle cx="125" cy="55" r="1.5" fill="#EF4444" opacity="0.4" />
        <circle cx="174" cy="56" r="4.5" fill="#DC2626" />
        <circle cx="173" cy="55" r="1.5" fill="#EF4444" opacity="0.4" />
        {/* Legs */}
        <line x1="147" y1="88" x2="143" y2="108" stroke="url(#heroSuit)" strokeWidth="6" strokeLinecap="round" />
        <line x1="153" y1="88" x2="157" y2="108" stroke="url(#heroSuit)" strokeWidth="6" strokeLinecap="round" />
        {/* Boots with 3D */}
        <ellipse cx="141" cy="110" rx="7" ry="4.5" fill="#DC2626" />
        <ellipse cx="139" cy="109" rx="3" ry="2" fill="#EF4444" opacity="0.4" />
        <ellipse cx="159" cy="110" rx="7" ry="4.5" fill="#DC2626" />
        <ellipse cx="157" cy="109" rx="3" ry="2" fill="#EF4444" opacity="0.4" />
      </g>
      {/* Power sparks with glow */}
      <g>
        <circle cx="122" cy="50" r="6" fill="#FBBF24" opacity="0.08" />
        <polygon points="122,46 123.5,49.5 127,49.5 124,52 125,55.5 122,53 119,55.5 120,52 117,49.5 120.5,49.5" fill="#FBBF24" opacity="0.8" />
        <circle cx="178" cy="50" r="6" fill="#FBBF24" opacity="0.08" />
        <polygon points="178,46 179.5,49.5 183,49.5 180,52 181,55.5 178,53 175,55.5 176,52 173,49.5 176.5,49.5" fill="#FBBF24" opacity="0.8" />
      </g>
      {/* Ground */}
      <rect x="0" y="118" width="300" height="10" fill="#1E3A5F" opacity="0.3" />
    </svg>
  );
}

function KindnessIllustration() {
  return (
    <svg viewBox="0 0 300 128" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="kind-bg" x1="0" y1="0" x2="0" y2="128">
          <stop stopColor="#BE185D" /><stop offset="0.5" stopColor="#EC4899" /><stop offset="1" stopColor="#DB2777" />
        </linearGradient>
        <radialGradient id="heartGrad" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </radialGradient>
        <radialGradient id="sunWarm" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FBBF24" opacity="0.6" />
          <stop offset="100%" stopColor="#FBBF24" opacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="128" fill="url(#kind-bg)" />
      {/* Sunshine with warm glow */}
      <circle cx="250" cy="22" r="30" fill="url(#sunWarm)" />
      <circle cx="250" cy="22" r="16" fill="#FBBF24" opacity="0.5" />
      <circle cx="250" cy="22" r="10" fill="#FEF3C7" opacity="0.6" />
      {/* Ground */}
      <ellipse cx="150" cy="138" rx="200" ry="28" fill="#4ADE80" opacity="0.25" />
      <ellipse cx="150" cy="135" rx="180" ry="22" fill="#86EFAC" opacity="0.15" />
      {/* Two children holding hands - 3D with shading */}
      {/* Child 1 */}
      <g>
        <circle cx="118" cy="58" r="11" fill="#FED7AA" />
        <circle cx="114" cy="54" r="4" fill="white" opacity="0.1" />
        <path d="M107,56 Q112,48 118,50 Q124,48 129,56" fill="#7C2D12" />
        <path d="M109,54 Q114,50 118,52 Q122,50 127,54" fill="#92400E" />
        <circle cx="114" cy="58" r="1.8" fill="#1F2937" />
        <circle cx="122" cy="58" r="1.8" fill="#1F2937" />
        <circle cx="115" cy="57" r="0.6" fill="white" />
        <circle cx="123" cy="57" r="0.6" fill="white" />
        <circle cx="110" cy="62" r="2.5" fill="#F9A8D4" opacity="0.35" />
        <circle cx="126" cy="62" r="2.5" fill="#F9A8D4" opacity="0.35" />
        <path d="M115,64 Q118,67 121,64" stroke="#1F2937" strokeWidth="1" fill="none" strokeLinecap="round" />
        <rect x="112" y="69" width="14" height="22" rx="5" fill="#A855F7" />
        <rect x="112" y="69" width="4" height="22" rx="2" fill="#9333EA" opacity="0.2" />
        <line x1="112" y1="78" x2="100" y2="84" stroke="#FED7AA" strokeWidth="4" strokeLinecap="round" />
        <line x1="126" y1="78" x2="139" y2="78" stroke="#FED7AA" strokeWidth="4" strokeLinecap="round" />
        <line x1="115" y1="91" x2="112" y2="109" stroke="#FED7AA" strokeWidth="4" strokeLinecap="round" />
        <line x1="123" y1="91" x2="126" y2="109" stroke="#FED7AA" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="111" cy="111" rx="5" ry="3" fill="#7C3AED" />
        <ellipse cx="127" cy="111" rx="5" ry="3" fill="#7C3AED" />
      </g>
      {/* Child 2 */}
      <g>
        <circle cx="172" cy="58" r="11" fill="#FECACA" />
        <circle cx="168" cy="54" r="4" fill="white" opacity="0.1" />
        <path d="M161,53 Q166,46 172,48 Q178,46 183,53" fill="#1E1B4B" />
        <path d="M163,52 Q168,48 172,50 Q176,48 181,52" fill="#312E81" />
        <circle cx="168" cy="58" r="1.8" fill="#1F2937" />
        <circle cx="176" cy="58" r="1.8" fill="#1F2937" />
        <circle cx="169" cy="57" r="0.6" fill="white" />
        <circle cx="177" cy="57" r="0.6" fill="white" />
        <circle cx="164" cy="62" r="2.5" fill="#F9A8D4" opacity="0.35" />
        <circle cx="180" cy="62" r="2.5" fill="#F9A8D4" opacity="0.35" />
        <path d="M169,64 Q172,67 175,64" stroke="#1F2937" strokeWidth="1" fill="none" strokeLinecap="round" />
        <rect x="164" y="69" width="14" height="22" rx="5" fill="#F97316" />
        <rect x="164" y="69" width="4" height="22" rx="2" fill="#EA580C" opacity="0.2" />
        <line x1="164" y1="78" x2="151" y2="78" stroke="#FECACA" strokeWidth="4" strokeLinecap="round" />
        <line x1="178" y1="78" x2="190" y2="84" stroke="#FECACA" strokeWidth="4" strokeLinecap="round" />
        <line x1="167" y1="91" x2="164" y2="109" stroke="#FECACA" strokeWidth="4" strokeLinecap="round" />
        <line x1="175" y1="91" x2="178" y2="109" stroke="#FECACA" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="163" cy="111" rx="5" ry="3" fill="#C2410C" />
        <ellipse cx="179" cy="111" rx="5" ry="3" fill="#C2410C" />
      </g>
      {/* Connected hands with highlight */}
      <circle cx="145" cy="78" r="4.5" fill="#FED7AA" />
      <circle cx="144" cy="77" r="1.5" fill="white" opacity="0.2" />
      {/* Main heart with 3D gradient */}
      <path d="M145,32 Q145,24 138,24 Q131,24 131,32 Q131,40 145,50 Q159,40 159,32 Q159,24 152,24 Q145,24 145,32" fill="url(#heartGrad)" />
      <path d="M145,34 Q145,28 140,28 Q135,28 135,34 Q135,38 145,46" fill="#FBCFE8" opacity="0.25" />
      {/* Heart glow */}
      <circle cx="145" cy="37" r="18" fill="#F472B6" opacity="0.08" />
      {/* Small floating hearts with 3D */}
      <g opacity="0.5">
        <path d="M82,38 Q82,34 78,34 Q74,34 74,38 Q74,42 82,47 Q90,42 90,38 Q90,34 86,34 Q82,34 82,38" fill="#F472B6" />
        <path d="M82,39 Q82,36 80,36 Q77,36 77,39" fill="#FBCFE8" opacity="0.3" />
      </g>
      <g opacity="0.35">
        <path d="M212,42 Q212,38 208,38 Q204,38 204,42 Q204,46 212,50 Q220,46 220,42 Q220,38 216,38 Q212,38 212,42" fill="#F472B6" />
      </g>
      <g opacity="0.25">
        <path d="M95,65 Q95,62 92,62 Q89,62 89,65 Q89,68 95,72 Q101,68 101,65 Q101,62 98,62 Q95,62 95,65" fill="#FBCFE8" />
      </g>
      {/* Flowers with 3D petals */}
      {[
        [55, 108, "#F472B6"], [95, 105, "#FBBF24"], [200, 106, "#C084FC"], [245, 108, "#60A5FA"]
      ].map(([x, y, color], i) => (
        <g key={i}>
          <line x1={x as number} y1={(y as number) + 10} x2={x as number} y2={y as number} stroke="#16A34A" strokeWidth="2" />
          <circle cx={x as number} cy={y as number} r={4} fill={color as string} />
          <circle cx={x as number} cy={y as number} r={2} fill="white" opacity="0.3" />
          <circle cx={(x as number) - 1} cy={(y as number) - 1} r={1} fill="white" opacity="0.35" />
        </g>
      ))}
      {/* Butterfly with 3D wings */}
      <g transform="translate(222,62)">
        <ellipse cx="-6" cy="0" rx="9" ry="6" fill="#C084FC" opacity="0.7" transform="rotate(-20)" />
        <ellipse cx="-4" cy="-1" rx="5" ry="3" fill="#E9D5FF" opacity="0.3" transform="rotate(-20)" />
        <ellipse cx="6" cy="0" rx="9" ry="6" fill="#DDD6FE" opacity="0.6" transform="rotate(20)" />
        <ellipse cx="4" cy="-1" rx="5" ry="3" fill="white" opacity="0.2" transform="rotate(20)" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#6B21A8" strokeWidth="1.2" />
        <line x1="0" y1="-4" x2="-3" y2="-7" stroke="#6B21A8" strokeWidth="0.6" />
        <line x1="0" y1="-4" x2="3" y2="-7" stroke="#6B21A8" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

const themeIllustrations: Record<string, React.FC> = {
  "space-adventure": SpaceIllustration,
  "dinosaur-discovery": DinoIllustration,
  "under-the-sea": OceanIllustration,
  "royal-quest": CastleIllustration,
  "superhero-origin": SuperheroIllustration,
  "kindness-courage": KindnessIllustration,
};

interface ThemeShowcaseProps {
  themes: Theme[];
}

function ThemeCard({ theme }: { theme: Theme }) {
  const Illustration = themeIllustrations[theme.id];

  return (
    <div className="min-w-[280px] sm:min-w-[300px] snap-center flex-shrink-0">
      <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-300 h-full">
        {/* Illustration header */}
        <div className="relative h-32 overflow-hidden">
          {Illustration ? (
            <Illustration />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${theme.colorScheme.gradient}`} />
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading text-lg font-bold text-gray-900">
              {theme.name}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${theme.colorScheme.bg} ${theme.colorScheme.accent}`}
            >
              Ages {theme.ageRange}
            </span>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
            {theme.description}
          </p>

          <Link href={`/create?theme=${theme.id}`}>
            <Button
              variant="outline"
              className={`w-full rounded-xl ${theme.colorScheme.border} hover:${theme.colorScheme.bg} font-medium text-sm transition-colors`}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Create This Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThemeShowcase({ themes }: ThemeShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section id="themes" className="py-20 sm:py-28 relative bg-[#FFF4CC]">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-[#FF9F1C] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">6 magical worlds 🌍</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            Choose Their Adventure!
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            Every theme is a unique story waiting for your child to be the hero.
          </p>
        </div>

        {/* Scroll controls */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#1a1a2e] shadow-[3px_3px_0px_#1a1a2e] items-center justify-center text-[#1a1a2e] hover:bg-[#FFD166] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#1a1a2e] shadow-[3px_3px_0px_#1a1a2e] items-center justify-center text-[#1a1a2e] hover:bg-[#FFD166] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
