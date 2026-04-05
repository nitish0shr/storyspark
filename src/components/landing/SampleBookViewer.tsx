"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ── Realistic 3D SVG illustrations for each sample page ── */

function HouseScene() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="60%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="grass1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="houseWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="50%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="sunRadial" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <radialGradient id="windowGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </radialGradient>
        <filter id="softShadow1" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#1E3A5F" floodOpacity="0.2" />
        </filter>
        <filter id="glow1">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cloudSoft">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {/* Sky */}
      <rect width="400" height="280" fill="url(#sky1)" />
      {/* Sun with glow */}
      <circle cx="320" cy="55" r="50" fill="#FDE68A" opacity="0.15" />
      <circle cx="320" cy="55" r="35" fill="#FDE68A" opacity="0.25" />
      <circle cx="320" cy="55" r="24" fill="url(#sunRadial)" />
      <circle cx="314" cy="48" r="8" fill="white" opacity="0.3" />
      {/* Clouds with soft 3D look */}
      <g opacity="0.9">
        <ellipse cx="80" cy="55" rx="44" ry="20" fill="white" opacity="0.95" />
        <ellipse cx="112" cy="50" rx="34" ry="16" fill="white" />
        <ellipse cx="64" cy="52" rx="26" ry="14" fill="white" />
        <ellipse cx="80" cy="48" rx="30" ry="12" fill="white" />
        <ellipse cx="80" cy="60" rx="36" ry="10" fill="#E0E7FF" opacity="0.4" />
      </g>
      <g opacity="0.8">
        <ellipse cx="240" cy="70" rx="38" ry="16" fill="white" />
        <ellipse cx="260" cy="66" rx="28" ry="13" fill="white" />
        <ellipse cx="240" cy="74" rx="30" ry="9" fill="#E0E7FF" opacity="0.3" />
      </g>
      {/* Ground with depth */}
      <ellipse cx="200" cy="290" rx="280" ry="58" fill="url(#grass1)" />
      <ellipse cx="200" cy="285" rx="270" ry="50" fill="#4ADE80" opacity="0.6" />
      <ellipse cx="200" cy="280" rx="250" ry="42" fill="#86EFAC" opacity="0.3" />
      {/* House shadow */}
      <ellipse cx="210" cy="238" rx="80" ry="12" fill="#1E3A5F" opacity="0.12" />
      {/* House with 3D effect */}
      <g filter="url(#softShadow1)">
        {/* Left wall (darker for depth) */}
        <rect x="140" y="130" width="60" height="100" fill="#FDBA74" />
        {/* Right wall (lighter) */}
        <rect x="200" y="130" width="60" height="100" fill="#FED7AA" />
        {/* Wall highlight */}
        <rect x="142" y="132" width="56" height="4" fill="white" opacity="0.2" />
        <rect x="202" y="132" width="56" height="4" fill="white" opacity="0.3" />
      </g>
      {/* Roof with 3D shading */}
      <polygon points="130,135 200,72 270,135" fill="url(#roofGrad)" />
      <polygon points="130,135 200,72 200,135" fill="#DC2626" opacity="0.3" />
      {/* Roof highlight */}
      <line x1="165" y1="103" x2="195" y2="78" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Door with 3D depth */}
      <rect x="175" y="180" width="30" height="50" rx="15" fill="#7C2D12" />
      <rect x="177" y="182" width="26" height="46" rx="13" fill="#92400E" />
      <rect x="179" y="184" width="6" height="42" rx="3" fill="#78350F" opacity="0.3" />
      <circle cx="198" cy="208" r="2.5" fill="#FBBF24" />
      <circle cx="197.5" cy="207.5" r="1" fill="#FEF3C7" />
      {/* Windows with glow */}
      <rect x="150" y="148" width="28" height="25" rx="3" fill="#1E3A5F" />
      <rect x="152" y="150" width="24" height="21" rx="2" fill="url(#windowGlow)" />
      <line x1="164" y1="150" x2="164" y2="171" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="152" y1="161" x2="176" y2="161" stroke="white" strokeWidth="2" opacity="0.6" />
      <rect x="222" y="148" width="28" height="25" rx="3" fill="#1E3A5F" />
      <rect x="224" y="150" width="24" height="21" rx="2" fill="url(#windowGlow)" />
      <line x1="236" y1="150" x2="236" y2="171" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="224" y1="161" x2="248" y2="161" stroke="white" strokeWidth="2" opacity="0.6" />
      {/* Chimney with 3D */}
      <rect x="232" y="80" width="18" height="42" rx="2" fill="#B91C1C" />
      <rect x="232" y="80" width="6" height="42" fill="#DC2626" opacity="0.4" />
      <rect x="230" y="78" width="22" height="6" rx="1" fill="#991B1B" />
      {/* Smoke with depth */}
      <circle cx="241" cy="68" r="6" fill="white" opacity="0.35" />
      <circle cx="246" cy="55" r="8" fill="white" opacity="0.25" />
      <circle cx="243" cy="40" r="10" fill="white" opacity="0.15" />
      {/* Tree with 3D trunk and canopy */}
      <rect x="58" y="155" width="16" height="65" rx="4" fill="url(#treeTrunk)" />
      {/* Tree shadow */}
      <ellipse cx="66" cy="222" rx="18" ry="5" fill="#1E3A5F" opacity="0.1" />
      {/* 3D layered foliage */}
      <circle cx="66" cy="132" r="34" fill="#15803D" />
      <circle cx="48" cy="145" r="22" fill="#166534" />
      <circle cx="84" cy="142" r="24" fill="#14532D" />
      <circle cx="66" cy="125" r="28" fill="#22C55E" />
      <circle cx="54" cy="136" r="18" fill="#16A34A" />
      <circle cx="78" cy="134" r="20" fill="#15803D" />
      {/* Foliage highlights */}
      <circle cx="58" cy="118" r="12" fill="#4ADE80" opacity="0.4" />
      <circle cx="74" cy="122" r="8" fill="#86EFAC" opacity="0.3" />
      {/* Flowers with 3D petals */}
      <g>
        <line x1="300" y1="232" x2="300" y2="218" stroke="#16A34A" strokeWidth="2" />
        <circle cx="300" cy="215" r="6" fill="#F472B6" />
        <circle cx="300" cy="215" r="3" fill="#FBCFE8" />
        <circle cx="300" cy="212" r="2" fill="white" opacity="0.4" />
      </g>
      <g>
        <line x1="320" y1="234" x2="320" y2="222" stroke="#16A34A" strokeWidth="2" />
        <circle cx="320" cy="219" r="5" fill="#C084FC" />
        <circle cx="320" cy="219" r="2.5" fill="#E9D5FF" />
      </g>
      <g>
        <line x1="340" y1="230" x2="340" y2="216" stroke="#16A34A" strokeWidth="2" />
        <circle cx="340" cy="213" r="6" fill="#FBBF24" />
        <circle cx="340" cy="213" r="3" fill="#FEF3C7" />
        <circle cx="340" cy="211" r="1.5" fill="white" opacity="0.4" />
      </g>
      <g>
        <line x1="100" y1="233" x2="100" y2="220" stroke="#16A34A" strokeWidth="2" />
        <circle cx="100" cy="217" r="5" fill="#FB923C" />
        <circle cx="100" cy="217" r="2.5" fill="#FED7AA" />
      </g>
      {/* Fence posts */}
      <rect x="290" y="200" width="3" height="35" rx="1" fill="#D6D3D1" />
      <rect x="310" y="202" width="3" height="33" rx="1" fill="#D6D3D1" />
      <rect x="330" y="198" width="3" height="36" rx="1" fill="#D6D3D1" />
      <rect x="350" y="200" width="3" height="34" rx="1" fill="#D6D3D1" />
      <line x1="291" y1="210" x2="352" y2="210" stroke="#D6D3D1" strokeWidth="2" />
      <line x1="291" y1="222" x2="352" y2="222" stroke="#D6D3D1" strokeWidth="2" />
      {/* Cobblestone path */}
      <path d="M180,230 Q185,245 178,260 Q175,275 180,280" stroke="#A8A29E" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M200,230 Q195,245 202,260 Q205,275 200,280" stroke="#A8A29E" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.25" />
    </svg>
  );
}

function StarWindowScene() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="night1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <radialGradient id="starGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#F59E0B" opacity="0.4" />
          <stop offset="100%" stopColor="#F59E0B" opacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
        <linearGradient id="windowFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="50%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="curtainL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="curtainR" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="sillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8A29E" />
          <stop offset="100%" stopColor="#78716C" />
        </linearGradient>
        <filter id="starBloom">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Night sky */}
      <rect width="400" height="280" fill="url(#night1)" />
      {/* Twinkling stars */}
      {[
        [30, 30, 1.8], [80, 60, 1.2], [150, 20, 2], [250, 45, 1.5], [350, 25, 2.2],
        [40, 100, 1], [120, 80, 1.5], [300, 90, 1.2], [370, 70, 1.8], [200, 100, 1],
        [15, 70, 0.8], [170, 50, 1.3], [280, 30, 0.9], [390, 55, 1.1],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r as number} fill="white" opacity={0.5 + (i % 3) * 0.15} />
          <circle cx={x} cy={y} r={(r as number) * 2.5} fill="white" opacity="0.04" />
        </g>
      ))}
      {/* Moon with 3D craters */}
      <circle cx="340" cy="50" r="26" fill="url(#moonGlow)" />
      <circle cx="350" cy="42" r="22" fill="url(#night1)" />
      <circle cx="334" cy="45" r="3" fill="#D4D4D8" opacity="0.2" />
      <circle cx="340" cy="55" r="2" fill="#D4D4D8" opacity="0.15" />
      {/* Moon glow */}
      <circle cx="340" cy="50" r="40" fill="#FDE68A" opacity="0.06" />
      {/* Window frame with 3D wood grain */}
      <rect x="95" y="85" width="210" height="170" rx="6" fill="url(#windowFrame)" />
      <rect x="97" y="87" width="206" height="3" fill="white" opacity="0.15" />
      {/* Window panes - dark glass reflecting night */}
      <rect x="105" y="95" width="90" height="72" rx="3" fill="#0F172A" />
      <rect x="205" y="95" width="90" height="72" rx="3" fill="#0F172A" />
      <rect x="105" y="177" width="90" height="68" rx="3" fill="#0F172A" />
      <rect x="205" y="177" width="90" height="68" rx="3" fill="#0F172A" />
      {/* Glass reflections */}
      <rect x="107" y="97" width="30" height="8" rx="2" fill="white" opacity="0.06" />
      <rect x="207" y="97" width="25" height="6" rx="2" fill="white" opacity="0.05" />
      {/* Stars visible through glass */}
      <circle cx="130" cy="115" r="1.5" fill="white" opacity="0.4" />
      <circle cx="160" cy="108" r="1" fill="white" opacity="0.3" />
      <circle cx="250" cy="112" r="1.5" fill="white" opacity="0.35" />
      <circle cx="270" cy="125" r="1" fill="white" opacity="0.25" />
      <circle cx="140" cy="200" r="1" fill="white" opacity="0.2" />
      <circle cx="260" cy="195" r="1.5" fill="white" opacity="0.3" />
      {/* Windowsill - 3D stone */}
      <rect x="90" y="250" width="220" height="15" rx="2" fill="url(#sillGrad)" />
      <rect x="90" y="250" width="220" height="3" fill="white" opacity="0.15" />
      <rect x="90" y="262" width="220" height="3" fill="black" opacity="0.1" />
      {/* Glowing star on sill */}
      <g filter="url(#starBloom)">
        <circle cx="200" cy="242" r="30" fill="#FBBF24" opacity="0.08" />
        <circle cx="200" cy="242" r="18" fill="#FBBF24" opacity="0.15" />
      </g>
      <polygon points="200,222 207,238 224,238 210,249 215,265 200,255 185,265 190,249 176,238 193,238" fill="url(#starGlow)" />
      {/* Star face */}
      <circle cx="195" cy="242" r="2" fill="#92400E" />
      <circle cx="205" cy="242" r="2" fill="#92400E" />
      <path d="M196,248 Q200,252 204,248" stroke="#92400E" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Star highlight */}
      <circle cx="196" cy="232" r="3" fill="white" opacity="0.3" />
      {/* Sparkle rays */}
      <line x1="200" y1="214" x2="200" y2="206" stroke="#FDE68A" strokeWidth="1.5" opacity="0.5" />
      <line x1="218" y1="228" x2="226" y2="222" stroke="#FDE68A" strokeWidth="1.5" opacity="0.4" />
      <line x1="182" y1="228" x2="174" y2="222" stroke="#FDE68A" strokeWidth="1.5" opacity="0.4" />
      <circle cx="210" cy="218" r="1.5" fill="#FDE68A" opacity="0.5" />
      <circle cx="188" cy="220" r="1" fill="#FDE68A" opacity="0.4" />
      {/* Curtains with 3D folds */}
      <path d="M98,88 Q108,130 102,170 Q96,210 100,255" fill="url(#curtainL)" opacity="0.6" />
      <path d="M98,88 Q112,130 108,170 Q104,210 106,255" fill="url(#curtainL)" opacity="0.3" />
      <path d="M302,88 Q292,130 298,170 Q304,210 300,255" fill="url(#curtainR)" opacity="0.6" />
      <path d="M302,88 Q288,130 292,170 Q296,210 294,255" fill="url(#curtainR)" opacity="0.3" />
      {/* Curtain rod */}
      <rect x="85" y="82" width="230" height="5" rx="2.5" fill="#78350F" />
      <circle cx="90" cy="84" r="5" fill="#92400E" />
      <circle cx="310" cy="84" r="5" fill="#92400E" />
      <circle cx="90" cy="83" r="2" fill="white" opacity="0.15" />
      <circle cx="310" cy="83" r="2" fill="white" opacity="0.15" />
    </svg>
  );
}

function MountainScene() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="rainbow1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="30%" stopColor="#C4B5FD" />
          <stop offset="60%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="mtn3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="mtnShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#1E1B4B" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Sky */}
      <rect width="400" height="280" fill="url(#rainbow1)" />
      {/* Rainbow arcs with glow */}
      {[
        ["#EF4444", 0], ["#F97316", 8], ["#FBBF24", 16], ["#22C55E", 24], ["#3B82F6", 32], ["#8B5CF6", 40]
      ].map(([color, offset], i) => (
        <path key={i} d={`M-20,${200 + (offset as number)} Q200,${-20 + (offset as number)} 420,${200 + (offset as number)}`} stroke={color as string} strokeWidth="6" fill="none" opacity="0.35" />
      ))}
      {/* Clouds with 3D volume */}
      <g opacity="0.95">
        <ellipse cx="60" cy="82" rx="48" ry="22" fill="white" />
        <ellipse cx="90" cy="75" rx="36" ry="18" fill="white" />
        <ellipse cx="45" cy="80" rx="28" ry="15" fill="white" />
        <ellipse cx="60" cy="72" rx="32" ry="14" fill="white" />
        <ellipse cx="60" cy="90" rx="38" ry="10" fill="#E8DEF8" opacity="0.3" />
      </g>
      <g opacity="0.85">
        <ellipse cx="320" cy="62" rx="42" ry="20" fill="white" />
        <ellipse cx="348" cy="56" rx="32" ry="16" fill="white" />
        <ellipse cx="320" cy="70" rx="34" ry="10" fill="#FBCFE8" opacity="0.3" />
      </g>
      {/* Cotton candy cloud */}
      <ellipse cx="195" cy="105" rx="52" ry="26" fill="#FBCFE8" opacity="0.8" />
      <ellipse cx="222" cy="98" rx="42" ry="22" fill="#F9A8D4" opacity="0.5" />
      <ellipse cx="185" cy="98" rx="30" ry="16" fill="white" opacity="0.3" />
      {/* Mountains with 3D shading */}
      <g filter="url(#mtnShadow)">
        <polygon points="0,280 80,120 160,280" fill="url(#mtn1)" opacity="0.8" />
        {/* Mountain shadow side */}
        <polygon points="80,120 120,200 160,280 80,280" fill="#3B0764" opacity="0.2" />
      </g>
      <g filter="url(#mtnShadow)">
        <polygon points="60,280 180,88 300,280" fill="url(#mtn2)" />
        <polygon points="180,88 240,184 300,280 180,280" fill="#4C1D95" opacity="0.2" />
      </g>
      <g filter="url(#mtnShadow)">
        <polygon points="200,280 310,125 420,280" fill="url(#mtn3)" opacity="0.85" />
        <polygon points="310,125 365,202 420,280 310,280" fill="#5B21B6" opacity="0.15" />
      </g>
      {/* Snow caps with highlights */}
      <polygon points="168,98 180,88 192,98 186,103 174,103" fill="white" opacity="0.95" />
      <polygon points="172,100 180,92 184,100" fill="white" />
      <polygon points="300,138 310,125 320,138 316,143 304,143" fill="white" opacity="0.95" />
      <polygon points="304,139 310,130 315,139" fill="white" />
      {/* Snow sparkle */}
      <circle cx="180" cy="93" r="1" fill="white" />
      <circle cx="310" cy="131" r="1" fill="white" />
      {/* Child + star flying */}
      <g>
        {/* Child */}
        <circle cx="195" cy="52" r="9" fill="#FECACA" />
        <path d="M186,50 Q190,44 195,46 Q200,44 204,50" fill="#92400E" opacity="0.8" />
        <circle cx="192" cy="52" r="1.5" fill="#1E1B4B" />
        <circle cx="198" cy="52" r="1.5" fill="#1E1B4B" />
        <path d="M193,56 Q195,59 197,56" stroke="#1E1B4B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <ellipse cx="195" cy="66" rx="7" ry="11" fill="#C084FC" />
        {/* Cape flowing */}
        <path d="M188,60 Q175,70 170,82" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* Arms spread */}
        <line x1="186" y1="62" x2="178" y2="54" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
        <line x1="204" y1="62" x2="212" y2="54" stroke="#FECACA" strokeWidth="3" strokeLinecap="round" />
        {/* Star companion */}
        <polygon points="226,46 229,53 236,53 230,58 232,65 226,60 220,65 222,58 216,53 223,53" fill="#FBBF24" />
        <circle cx="226" cy="55" r="12" fill="#FBBF24" opacity="0.1" />
        <circle cx="224" cy="53" r="1" fill="#1E1B4B" />
        <circle cx="228" cy="53" r="1" fill="#1E1B4B" />
        {/* Star sparkle */}
        <circle cx="226" cy="48" r="1.5" fill="white" opacity="0.4" />
      </g>
      {/* Birds */}
      <path d="M100,45 Q105,39 110,45" stroke="#4C1D95" strokeWidth="1.5" fill="none" />
      <path d="M120,35 Q125,29 130,35" stroke="#4C1D95" strokeWidth="1.5" fill="none" />
      <path d="M140,42 Q144,37 148,42" stroke="#4C1D95" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function BraveScene() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="sunset1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#FECACA" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="grassBrave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <radialGradient id="skinTone" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FECACA" />
        </radialGradient>
        <filter id="speechShadow">
          <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Warm sunset sky */}
      <rect width="400" height="280" fill="url(#sunset1)" />
      {/* Sun rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line
          key={angle}
          x1="200"
          y1="160"
          x2={200 + Math.cos((angle * Math.PI) / 180) * 220}
          y2={160 + Math.sin((angle * Math.PI) / 180) * 220}
          stroke="#FBBF24"
          strokeWidth="1.5"
          opacity="0.08"
        />
      ))}
      {/* Ground with depth */}
      <ellipse cx="200" cy="300" rx="300" ry="65" fill="url(#grassBrave)" />
      <ellipse cx="200" cy="295" rx="280" ry="55" fill="#4ADE80" opacity="0.4" />
      {/* Flowers field with 3D petals */}
      {[
        [40, 250, "#F472B6"], [80, 247, "#C084FC"], [130, 252, "#FBBF24"],
        [270, 248, "#FB923C"], [310, 253, "#60A5FA"], [350, 249, "#F472B6"],
        [60, 255, "#A855F7"], [160, 256, "#FDE68A"], [240, 254, "#EC4899"], [360, 252, "#22C55E"]
      ].map(([x, y, color], i) => (
        <g key={i}>
          <line x1={x as number} y1={(y as number) + 8} x2={x as number} y2={y as number} stroke="#16A34A" strokeWidth="2" />
          <circle cx={x as number} cy={y as number} r={4 + (i % 2)} fill={color as string} />
          <circle cx={x as number} cy={y as number} r={2 + (i % 2) * 0.5} fill="white" opacity="0.3" />
          <circle cx={(x as number) - 1} cy={(y as number) - 1} r={1} fill="white" opacity="0.4" />
        </g>
      ))}
      {/* Child character - 3D with shading */}
      <g>
        {/* Shadow on ground */}
        <ellipse cx="182" cy="242" rx="20" ry="5" fill="#1E3A5F" opacity="0.1" />
        {/* Head */}
        <circle cx="180" cy="170" r="16" fill="url(#skinTone)" />
        {/* Hair with 3D volume */}
        <path d="M164,168 Q168,148 180,150 Q192,148 196,168" fill="#7C2D12" />
        <path d="M166,166 Q170,150 180,152 Q190,150 194,166" fill="#92400E" />
        <path d="M170,156 Q175,152 180,154" fill="#A16207" opacity="0.3" />
        {/* Eyes with highlights */}
        <circle cx="174" cy="172" r="2.5" fill="#1F2937" />
        <circle cx="186" cy="172" r="2.5" fill="#1F2937" />
        <circle cx="175" cy="171" r="0.8" fill="white" />
        <circle cx="187" cy="171" r="0.8" fill="white" />
        {/* Rosy cheeks */}
        <circle cx="170" cy="176" r="3" fill="#F9A8D4" opacity="0.4" />
        <circle cx="190" cy="176" r="3" fill="#F9A8D4" opacity="0.4" />
        {/* Smile */}
        <path d="M175,179 Q180,184 185,179" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Body with 3D shading */}
        <rect x="171" y="186" width="18" height="30" rx="6" fill="#A855F7" />
        <rect x="171" y="186" width="6" height="30" rx="3" fill="#9333EA" opacity="0.3" />
        <rect x="173" y="188" width="14" height="3" fill="white" opacity="0.15" />
        {/* Arms */}
        <line x1="171" y1="196" x2="156" y2="202" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
        <line x1="189" y1="196" x2="204" y2="188" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
        {/* Hands */}
        <circle cx="154" cy="203" r="3.5" fill="#FED7AA" />
        <circle cx="206" cy="187" r="3.5" fill="#FED7AA" />
        {/* Legs */}
        <line x1="176" y1="216" x2="173" y2="238" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
        <line x1="184" y1="216" x2="187" y2="238" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
        {/* Shoes with 3D shine */}
        <ellipse cx="171" cy="240" rx="7" ry="4" fill="#DC2626" />
        <ellipse cx="189" cy="240" rx="7" ry="4" fill="#DC2626" />
        <ellipse cx="169" cy="239" rx="3" ry="1.5" fill="#EF4444" opacity="0.5" />
        <ellipse cx="187" cy="239" rx="3" ry="1.5" fill="#EF4444" opacity="0.5" />
      </g>
      {/* Star friend - 3D with glow */}
      <g>
        <circle cx="222" cy="190" r="22" fill="#FBBF24" opacity="0.08" />
        <circle cx="222" cy="190" r="14" fill="#FBBF24" opacity="0.12" />
        <polygon points="222,172 226,183 238,183 228,191 232,202 222,195 212,202 216,191 206,183 218,183" fill="#FBBF24" />
        {/* Star highlight */}
        <polygon points="222,175 224,181 230,181 225,185 227,191 222,187 217,191 219,185 214,181 220,181" fill="#FDE68A" opacity="0.5" />
        {/* Star face */}
        <circle cx="218" cy="188" r="2" fill="#1F2937" />
        <circle cx="226" cy="188" r="2" fill="#1F2937" />
        <circle cx="219" cy="187" r="0.6" fill="white" />
        <circle cx="227" cy="187" r="0.6" fill="white" />
        <path d="M219,193 Q222,197 225,193" stroke="#1F2937" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      {/* Speech bubble with 3D shadow */}
      <g filter="url(#speechShadow)">
        <rect x="236" y="142" width="132" height="38" rx="18" fill="white" />
        <polygon points="244,180 252,174 258,180" fill="white" />
      </g>
      <text x="258" y="164" fontSize="10" fill="#7C3AED" fontWeight="bold" fontFamily="sans-serif">
        You are braver
      </text>
      <text x="262" y="176" fontSize="9" fill="#9333EA" fontFamily="sans-serif">
        than you know!
      </text>
      {/* Butterflies */}
      <g transform="translate(320,200)" opacity="0.6">
        <ellipse cx="-5" cy="0" rx="6" ry="4" fill="#C084FC" transform="rotate(-15)" />
        <ellipse cx="5" cy="0" rx="6" ry="4" fill="#DDD6FE" transform="rotate(15)" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="#6B21A8" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function NightSkyScene() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="finalNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="30%" stopColor="#0F172A" />
          <stop offset="60%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <radialGradient id="moonGlow2" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
        <radialGradient id="goldenStar" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <filter id="nightGlow">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Deep night sky */}
      <rect width="400" height="280" fill="url(#finalNight)" />
      {/* Milky way band */}
      <ellipse cx="200" cy="80" rx="300" ry="30" fill="white" opacity="0.02" transform="rotate(-15,200,80)" />
      <ellipse cx="200" cy="80" rx="200" ry="18" fill="white" opacity="0.03" transform="rotate(-15,200,80)" />
      {/* Twinkling stars with glow */}
      {[
        [20, 20, 2.2], [60, 50, 1.5], [100, 28, 2.8], [140, 62, 1.5], [180, 12, 2],
        [220, 38, 3], [260, 18, 1.5], [300, 52, 2], [340, 28, 2.5], [380, 42, 1.5],
        [50, 88, 1.5], [110, 98, 2], [170, 82, 1.5], [230, 92, 2], [290, 78, 2.5],
        [350, 98, 1.5], [30, 128, 1], [90, 138, 1.5], [320, 122, 2], [375, 132, 1],
        [15, 55, 1.2], [75, 35, 1], [155, 45, 1.8], [245, 65, 1.2], [365, 15, 2],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) * 3} fill="white" opacity="0.02" />
          <circle cx={x} cy={y} r={r as number} fill="white" opacity={0.4 + (i % 5) * 0.12} />
          {(r as number) > 2 && (
            <>
              <line x1={(x as number) - (r as number) * 1.5} y1={y} x2={(x as number) + (r as number) * 1.5} y2={y} stroke="white" strokeWidth="0.3" opacity="0.2" />
              <line x1={x} y1={(y as number) - (r as number) * 1.5} x2={x} y2={(y as number) + (r as number) * 1.5} stroke="white" strokeWidth="0.3" opacity="0.2" />
            </>
          )}
        </g>
      ))}
      {/* Special golden star with bloom */}
      <g filter="url(#nightGlow)">
        <circle cx="200" cy="72" r="18" fill="#FBBF24" opacity="0.06" />
      </g>
      <circle cx="200" cy="72" r="25" fill="#FBBF24" opacity="0.04" />
      <polygon points="200,55 205,68 218,68 207,77 211,90 200,82 189,90 193,77 182,68 195,68" fill="url(#goldenStar)" />
      {/* Star cross-glow */}
      <line x1="185" y1="72" x2="215" y2="72" stroke="#FDE68A" strokeWidth="0.8" opacity="0.3" />
      <line x1="200" y1="57" x2="200" y2="87" stroke="#FDE68A" strokeWidth="0.8" opacity="0.3" />
      {/* Moon with 3D surface */}
      <circle cx="50" cy="40" r="28" fill="url(#moonGlow2)" />
      <circle cx="62" cy="32" r="22" fill="url(#finalNight)" />
      {/* Moon craters */}
      <circle cx="42" cy="38" r="3" fill="#D4D4D8" opacity="0.15" />
      <circle cx="48" cy="48" r="2" fill="#D4D4D8" opacity="0.1" />
      <circle cx="38" cy="30" r="1.5" fill="#D4D4D8" opacity="0.12" />
      {/* Moon glow */}
      <circle cx="50" cy="40" r="42" fill="#FDE68A" opacity="0.04" />
      {/* Ground - layered hills */}
      <path d="M0,225 Q50,210 100,218 Q150,226 200,212 Q250,198 300,215 Q350,232 400,205 L400,280 L0,280 Z" fill="url(#hillGrad)" />
      <path d="M0,238 Q60,225 120,232 Q180,238 240,228 Q300,218 360,235 Q380,240 400,230 L400,280 L0,280 Z" fill="#15803D" opacity="0.15" />
      {/* Grass tufts */}
      <path d="M140,220 L145,212 L148,220" stroke="#1E3A5F" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M260,215 L265,208 L268,215" stroke="#1E3A5F" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Child silhouette sitting on hill */}
      <g>
        {/* Body */}
        <circle cx="200" cy="192" r="13" fill="#1E1B4B" />
        <ellipse cx="200" cy="210" rx="9" ry="13" fill="#1E1B4B" />
        {/* Legs dangling */}
        <line x1="194" y1="221" x2="189" y2="240" stroke="#1E1B4B" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="206" y1="221" x2="211" y2="240" stroke="#1E1B4B" strokeWidth="5.5" strokeLinecap="round" />
        {/* Arm pointing up at star */}
        <line x1="209" y1="204" x2="220" y2="180" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
        {/* Other arm resting */}
        <line x1="191" y1="206" x2="182" y2="218" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
        {/* Hair outline */}
        <path d="M188,186 Q192,178 200,180 Q208,178 212,186" fill="#0F172A" />
      </g>
      {/* Fireflies with glow */}
      {[
        [120, 200], [280, 192], [320, 218], [80, 212], [160, 225], [340, 200]
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#FBBF24" opacity="0.06" />
          <circle cx={x} cy={y} r="2" fill="#FBBF24" opacity={0.4 + (i % 3) * 0.15} />
        </g>
      ))}
      {/* Shooting star */}
      <line x1="340" y1="20" x2="290" y2="55" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <line x1="340" y1="20" x2="320" y2="35" stroke="white" strokeWidth="2.5" opacity="0.3" />
      <circle cx="290" cy="55" r="2.5" fill="white" opacity="0.7" />
      <circle cx="290" cy="55" r="5" fill="white" opacity="0.1" />
    </svg>
  );
}

const samplePages = [
  {
    illustration: HouseScene,
    text: "Once upon a time, in a cozy little house on Maple Street, lived a child with the biggest imagination in the whole wide world.",
    label: "Page 1",
  },
  {
    illustration: StarWindowScene,
    text: "One sunny morning, something magical happened. A tiny, glowing star landed right on their windowsill and whispered, \"Come on an adventure!\"",
    label: "Page 2",
  },
  {
    illustration: MountainScene,
    text: "Together they flew over rainbow mountains and through clouds made of cotton candy, meeting friendly creatures along the way.",
    label: "Page 3",
  },
  {
    illustration: BraveScene,
    text: "\"You are braver than you know,\" said the star. And with a big smile, they knew that was the truest thing anyone had ever said.",
    label: "Page 4",
  },
  {
    illustration: NightSkyScene,
    text: "And from that day on, every time they looked up at the night sky, they knew the stars were twinkling just for them. The End.",
    label: "Page 5",
  },
];

export default function SampleBookViewer() {
  const [currentPage, setCurrentPage] = useState(0);

  const goTo = (page: number) => {
    if (page >= 0 && page < samplePages.length) {
      setCurrentPage(page);
    }
  };

  const page = samplePages[currentPage];
  const Illustration = page.illustration;

  return (
    <section id="sample-book" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/30 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-600 mb-3">
            Sneak Peek
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Peek Inside a Storybook
          </h2>
          <p className="text-lg text-gray-500">
            This could be <span className="font-semibold text-violet-600">YOUR</span>{" "}
            child&apos;s story
          </p>
        </div>

        {/* Book viewer */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Book frame */}
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-violet-200/40 border border-violet-100/60 overflow-hidden">
              {/* Page illustration area */}
              <div className="relative h-56 sm:h-72 overflow-hidden transition-all duration-500 ease-in-out">
                <Illustration />

                {/* Page indicator */}
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white/80">
                  {page.label}
                </div>
              </div>

              {/* Text area */}
              <div className="p-6 sm:p-8">
                <p className="font-heading text-base sm:text-lg text-gray-800 leading-relaxed text-center italic">
                  &ldquo;{page.text}&rdquo;
                </p>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0}
              className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === samplePages.length - 1}
              className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Page dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {samplePages.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? "w-8 h-2.5 bg-gradient-to-r from-violet-500 to-pink-500"
                    : "w-2.5 h-2.5 bg-violet-200 hover:bg-violet-300"
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
