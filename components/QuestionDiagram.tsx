'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { Question } from '@/lib/types';

export function QuestionDiagram({
  diagramType,
  imageUrl,
  mode = 'question',
}: {
  diagramType?: Question['diagramType'];
  imageUrl?: string;
  mode?: 'question' | 'reference';
}) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const hasDiagram = Boolean(diagramType && diagramType !== 'none');
  const hasExternalImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  if (!hasDiagram && !hasExternalImage) return null;

  const cycleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.max(1, Math.min(2.5, next));
    });
  };

  const renderDiagramSvg = () => (
    <>
      {hasExternalImage && !imageLoadError && (
        <div className="mx-auto flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Question visual figure"
            onError={() => setImageLoadError(true)}
            className="max-h-64 w-auto rounded border border-slate-200 object-contain"
          />
        </div>
      )}

      {hasExternalImage && imageLoadError && (
        <div className="mx-auto flex max-w-md items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            External diagram image could not be loaded. Refer to the technical vector figure or geometric statement below.
          </span>
        </div>
      )}

      {diagramType === 'isometric-blocks' && (
        <svg
          viewBox="0 0 420 220"
          className="mx-auto h-52 w-full max-w-md"
          role="img"
          aria-label="Isometric projection of a stepped L-shaped polyhedral solid with two rectangular channels"
        >
          <defs>
            <pattern id="isoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>
          <rect width="420" height="220" fill="url(#isoGrid)" rx="6" />
          {/* Top Upper Terrace */}
          <polygon
            points="210,32 280,68 235,92 165,56"
            fill="#e0f2fe"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Middle Step Plane */}
          <polygon
            points="165,92 235,128 190,152 120,116"
            fill="#bae6fd"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Lower Front Terrace */}
          <polygon
            points="235,128 305,92 340,110 270,146"
            fill="#e0f2fe"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Vertical Risers */}
          <polygon
            points="165,56 235,92 235,128 165,92"
            fill="#94a3b8"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <polygon
            points="235,92 280,68 280,105 235,128"
            fill="#64748b"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Left Front Stepped Wall */}
          <polygon
            points="120,116 190,152 190,190 120,154"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Right Recessed Channel Wall */}
          <polygon
            points="190,152 270,146 270,184 190,190"
            fill="#475569"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <polygon
            points="270,146 340,110 340,148 270,184"
            fill="#64748b"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Axis Reference */}
          <g transform="translate(46, 178)">
            <line x1="0" y1="0" x2="0" y2="-32" stroke="#0284c7" strokeWidth="2" />
            <line x1="0" y1="0" x2="28" y2="-14" stroke="#0284c7" strokeWidth="2" />
            <line x1="0" y1="0" x2="-28" y2="-14" stroke="#0284c7" strokeWidth="2" />
            <text x="-4" y="-36" fontSize="10" fill="#0f172a" fontFamily="monospace">
              +Z
            </text>
            <text x="32" y="-12" fontSize="10" fill="#0f172a" fontFamily="monospace">
              +X
            </text>
            <text x="-44" y="-12" fontSize="10" fill="#0f172a" fontFamily="monospace">
              +Y
            </text>
          </g>
        </svg>
      )}

      {diagramType === 'gear-train' && (
        <svg
          viewBox="0 0 440 200"
          className="mx-auto h-48 w-full max-w-md"
          role="img"
          aria-label="Compound gear train with Gear A (24T), coaxial Gears B (48T) and C (16T), and output Gear D (32T)"
        >
          <rect width="440" height="200" fill="#f8fafc" rx="6" />
          {/* Gear A (24T) */}
          <circle
            cx="85"
            cy="100"
            r="34"
            fill="#e0f2fe"
            stroke="#0284c7"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <circle cx="85" cy="100" r="6" fill="#0f172a" />
          <text x="58" y="52" fontSize="11" fontWeight="600" fill="#0f172a">
            Gear A (24T)
          </text>
          <text x="52" y="154" fontSize="10" fill="#0369a1" fontFamily="monospace">
            60 RPM CW ↻
          </text>

          {/* Gear B (48T) */}
          <circle
            cx="188"
            cy="100"
            r="66"
            fill="#f1f5f9"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="7 4"
          />
          {/* Coaxial Gear C (16T) */}
          <circle
            cx="188"
            cy="100"
            r="24"
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
          <circle cx="188" cy="100" r="6" fill="#0f172a" />
          <text x="150" y="24" fontSize="11" fontWeight="600" fill="#0f172a">
            Gear B (48T) + Coaxial C (16T)
          </text>

          {/* Output Gear D (32T) */}
          <circle
            cx="306"
            cy="100"
            r="46"
            fill="#fef3c7"
            stroke="#d97706"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <circle cx="306" cy="100" r="6" fill="#0f172a" />
          <text x="275" y="42" fontSize="11" fontWeight="600" fill="#0f172a">
            Gear D (32T)
          </text>
          <text x="270" y="165" fontSize="10" fill="#b45309" fontFamily="monospace">
            Revs in 4 min = ?
          </text>
        </svg>
      )}

      {diagramType === 'tessellation-grid' && (
        <svg
          viewBox="0 0 360 200"
          className="mx-auto h-48 w-full max-w-sm"
          role="img"
          aria-label="Regular hexagon of side 6 cm with an inscribed equilateral triangle connecting alternating vertices"
        >
          <rect width="360" height="200" fill="#f8fafc" rx="6" />
          {/* Regular Hexagon */}
          <polygon
            points="180,22 250,62 250,142 180,182 110,142 110,62"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          {/* Inscribed Equilateral Triangle */}
          <polygon
            points="180,22 250,142 110,142"
            fill="#bae6fd"
            fillOpacity="0.7"
            stroke="#0284c7"
            strokeWidth="2.5"
          />
          {/* Dashed Subdivision Guides */}
          <line
            x1="180"
            y1="102"
            x2="180"
            y2="22"
            stroke="#64748b"
            strokeDasharray="4 4"
          />
          <line
            x1="180"
            y1="102"
            x2="250"
            y2="142"
            stroke="#64748b"
            strokeDasharray="4 4"
          />
          <line
            x1="180"
            y1="102"
            x2="110"
            y2="142"
            stroke="#64748b"
            strokeDasharray="4 4"
          />
          <text x="258" y="105" fontSize="11" fontFamily="monospace" fill="#0f172a">
            a = 6 cm
          </text>
        </svg>
      )}

      {diagramType === 'cube-folding' && (
        <svg
          viewBox="0 0 380 220"
          className="mx-auto h-52 w-full max-w-md"
          role="img"
          aria-label="Unfolded 6-face cube net with symbols on faces 1, 2, 3, and 5"
        >
          <rect width="380" height="220" fill="#f8fafc" rx="6" />
          {/* Face 1 */}
          <rect
            x="145"
            y="20"
            width="52"
            height="52"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <polygon points="171,32 184,56 158,56" fill="#0f172a" />
          <text x="150" y="32" fontSize="10" fontFamily="monospace" fill="#475569">
            1
          </text>

          {/* Face 2 */}
          <rect
            x="145"
            y="72"
            width="52"
            height="52"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line x1="153" y1="116" x2="189" y2="80" stroke="#0284c7" strokeWidth="2.5" />
          <text x="150" y="84" fontSize="10" fontFamily="monospace" fill="#475569">
            2
          </text>

          {/* Face 3 (Left of 2) */}
          <rect
            x="93"
            y="72"
            width="52"
            height="52"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <circle cx="110" cy="90" r="5" fill="#0f172a" />
          <text x="98" y="84" fontSize="10" fontFamily="monospace" fill="#475569">
            3
          </text>

          {/* Face 5 (Right of 2) */}
          <rect
            x="197"
            y="72"
            width="52"
            height="52"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line x1="238" y1="98" x2="206" y2="98" stroke="#0f172a" strokeWidth="2.2" />
          <polygon points="205,98 214,93 214,103" fill="#0f172a" />
          <text x="202" y="84" fontSize="10" fontFamily="monospace" fill="#475569">
            5
          </text>

          {/* Face 6 (Right of 5) */}
          <rect
            x="249"
            y="72"
            width="52"
            height="52"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <text x="254" y="84" fontSize="10" fontFamily="monospace" fill="#475569">
            6
          </text>

          {/* Face 4 (Below 2) */}
          <rect
            x="145"
            y="124"
            width="52"
            height="52"
            fill="#e0f2fe"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <text x="150" y="136" fontSize="10" fontFamily="monospace" fill="#0369a1">
            4
          </text>
        </svg>
      )}

      {diagramType === 'typography-kerning' && (
        <svg
          viewBox="0 0 420 170"
          className="mx-auto h-40 w-full max-w-md"
          role="img"
          aria-label="Typographic cap-height and baseline diagram illustrating optical overshoot on O and A compared to H"
        >
          <rect width="420" height="170" fill="#ffffff" rx="6" />
          {/* Cap Height Line */}
          <line
            x1="30"
            y1="42"
            x2="390"
            y2="42"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text x="35" y="35" fontSize="10" fontFamily="monospace" fill="#0284c7">
            CAP HEIGHT
          </text>
          {/* Baseline */}
          <line
            x1="30"
            y1="132"
            x2="390"
            y2="132"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <text x="35" y="148" fontSize="10" fontFamily="monospace" fill="#0f172a">
            BASELINE
          </text>
          {/* Flat H */}
          <path
            d="M 110 42 L 110 132 M 160 42 L 160 132 M 110 86 L 160 86"
            stroke="#0f172a"
            strokeWidth="12"
          />
          {/* Curved O with Overshoot */}
          <ellipse
            cx="235"
            cy="87"
            rx="34"
            ry="48"
            fill="none"
            stroke="#0284c7"
            strokeWidth="11"
          />
          {/* Pointed A with Apex Overshoot */}
          <path
            d="M 305 132 L 335 37 L 365 132 M 315 104 L 355 104"
            fill="none"
            stroke="#0f172a"
            strokeWidth="10"
          />
        </svg>
      )}

      {diagramType === 'perspective-corridor' && (
        <svg
          viewBox="0 0 420 200"
          className="mx-auto h-48 w-full max-w-md"
          role="img"
          aria-label="One-point perspective diagram showing receding vertical columns and midpoint diagonal construction ray"
        >
          <rect width="420" height="200" fill="#f8fafc" rx="6" />
          {/* Horizon Line */}
          <line
            x1="20"
            y1="95"
            x2="400"
            y2="95"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="26" y="88" fontSize="10" fontFamily="monospace" fill="#475569">
            HORIZON LINE (EYE LEVEL)
          </text>
          {/* Vanishing Point */}
          <circle cx="350" cy="95" r="4" fill="#dc2626" />
          <text x="342" y="84" fontSize="10" fontFamily="monospace" fill="#dc2626">
            VP
          </text>
          {/* Top & Bottom Perspective Rays */}
          <line x1="60" y1="25" x2="350" y2="95" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="60" y1="175" x2="350" y2="95" stroke="#0f172a" strokeWidth="1.5" />
          {/* Midpoint Ray */}
          <line
            x1="60"
            y1="100"
            x2="350"
            y2="95"
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          {/* Columns 1, 2, 3, 4 */}
          <line x1="80" y1="30" x2="80" y2="170" stroke="#0f172a" strokeWidth="4" />
          <line x1="165" y1="50" x2="165" y2="146" stroke="#0f172a" strokeWidth="3.5" />
          <line x1="224" y1="65" x2="224" y2="130" stroke="#0f172a" strokeWidth="3" />
          <line x1="264" y1="74" x2="264" y2="119" stroke="#0f172a" strokeWidth="2.5" />
          {/* Construction Diagonal from Base 1 through Midpoint 2 to Top 3 */}
          <line
            x1="80"
            y1="170"
            x2="224"
            y2="65"
            stroke="#0284c7"
            strokeWidth="2"
          />
        </svg>
      )}

      {diagramType === 'pulley-system' && (
        <svg
          viewBox="0 0 360 210"
          className="mx-auto h-48 w-full max-w-sm"
          role="img"
          aria-label="Compound pulley block with 4 vertical supporting strands on the lower movable block and 1 downward redirect pull strand"
        >
          <rect width="360" height="210" fill="#f8fafc" rx="6" />
          {/* Ceiling Beam */}
          <line x1="70" y1="22" x2="290" y2="22" stroke="#0f172a" strokeWidth="5" />
          {/* Upper Fixed Block */}
          <rect
            x="125"
            y="22"
            width="90"
            height="34"
            rx="6"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Lower Movable Block */}
          <rect
            x="125"
            y="112"
            width="75"
            height="30"
            rx="6"
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="2"
          />
          {/* 4 Load-bearing vertical strands */}
          <line x1="135" y1="56" x2="135" y2="112" stroke="#0f172a" strokeWidth="2" />
          <line x1="153" y1="56" x2="153" y2="112" stroke="#0f172a" strokeWidth="2" />
          <line x1="171" y1="56" x2="171" y2="112" stroke="#0f172a" strokeWidth="2" />
          <line x1="189" y1="56" x2="189" y2="112" stroke="#0f172a" strokeWidth="2" />
          {/* 5th Downward Redirect Strand */}
          <line x1="210" y1="45" x2="245" y2="145" stroke="#dc2626" strokeWidth="2.2" />
          <text x="252" y="142" fontSize="11" fontFamily="monospace" fill="#dc2626">
            Pull F = ?
          </text>
          {/* Suspended Load W = 120 N */}
          <rect
            x="132"
            y="152"
            width="60"
            height="38"
            rx="4"
            fill="#0f172a"
          />
          <text x="140" y="175" fontSize="11" fontFamily="monospace" fill="#ffffff">
            W=120N
          </text>
        </svg>
      )}

      {diagramType === 'paper-punch-symmetry' && (
        <svg
          viewBox="0 0 420 190"
          className="mx-auto h-44 w-full max-w-md"
          role="img"
          aria-label="Three-step paper folding sequence (horizontal, vertical, diagonal) with two internal circle punches and one semi-circular crease notch"
        >
          <rect width="420" height="190" fill="#f8fafc" rx="6" />
          {/* Step 1: Square */}
          <rect
            x="24"
            y="45"
            width="90"
            height="90"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="24"
            y1="90"
            x2="114"
            y2="90"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="32" y="155" fontSize="10" fontFamily="monospace" fill="#334155">
            1. Fold Up
          </text>

          {/* Step 2: Half -> Quarter */}
          <rect
            x="154"
            y="45"
            width="90"
            height="45"
            fill="#e0f2fe"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <line
            x1="199"
            y1="45"
            x2="199"
            y2="90"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="155" y="155" fontSize="10" fontFamily="monospace" fill="#334155">
            2. Fold Right
          </text>

          {/* Step 3: Diagonal Triangle + Punches */}
          <polygon
            points="300,95 375,20 375,95"
            fill="#bae6fd"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Two internal circular holes */}
          <circle cx="352" cy="65" r="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="362" cy="80" r="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          {/* Semi-circular notch on diagonal internal crease */}
          <path
            d="M 332 63 A 7 7 0 0 1 342 73"
            fill="#ffffff"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <text x="268" y="155" fontSize="10" fontFamily="monospace" fill="#0f172a">
            3. Diagonal + Punches
          </text>
        </svg>
      )}

      {diagramType === 'reuleaux-roller' && (
        <svg
          viewBox="0 0 420 190"
          className="mx-auto h-44 w-full max-w-md"
          role="img"
          aria-label="Flat horizontal steel plank resting on two Reuleaux constant-width rollers of width W = 14 cm"
        >
          <rect width="420" height="190" fill="#f8fafc" rx="6" />
          {/* Floor */}
          <line x1="25" y1="152" x2="395" y2="152" stroke="#0f172a" strokeWidth="3" />
          {/* Top Plank */}
          <rect
            x="45"
            y="44"
            width="310"
            height="18"
            rx="3"
            fill="#0f172a"
          />
          <text x="65" y="36" fontSize="11" fontFamily="monospace" fill="#0284c7" fontWeight="600">
            Top Plank Advances = ? cm (1 Roller Revolution)
          </text>
          {/* Reuleaux Roller 1 */}
          <path
            d="M 125 62 A 90 90 0 0 1 165 152 A 90 90 0 0 1 85 152 A 90 90 0 0 1 125 62 Z"
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="2.5"
          />
          {/* Reuleaux Roller 2 */}
          <path
            d="M 265 62 A 90 90 0 0 1 305 152 A 90 90 0 0 1 225 152 A 90 90 0 0 1 265 62 Z"
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="2.5"
          />
          <text x="95" y="172" fontSize="10" fontFamily="monospace" fill="#334155">
            Constant Width W = 14 cm
          </text>
        </svg>
      )}

      {diagramType === 'orthographic-views' && (
        <svg
          viewBox="0 0 440 190"
          className="mx-auto h-44 w-full max-w-md"
          role="img"
          aria-label="Front, Top, and Right-Side 3x3 orthographic projection grids of a 3D unit-cube assembly"
        >
          <rect width="440" height="190" fill="#f8fafc" rx="6" />
          {/* FRONT VIEW (heights per column: 3, 2, 2) */}
          <text x="42" y="30" fontSize="11" fontWeight="600" fontFamily="monospace" fill="#0f172a">
            FRONT VIEW
          </text>
          {[0, 1, 2].map((col) =>
            [0, 1, 2].map((row) => {
              const filled =
                (col === 0 && row >= 0) ||
                (col === 1 && row >= 1) ||
                (col === 2 && row >= 1);
              return (
                <rect
                  key={`f-${col}-${row}`}
                  x={38 + col * 28}
                  y={42 + row * 28}
                  width="28"
                  height="28"
                  fill={filled ? '#bae6fd' : '#ffffff'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              );
            })
          )}

          {/* TOP VIEW (7 occupied cells out of 9) */}
          <text x="182" y="30" fontSize="11" fontWeight="600" fontFamily="monospace" fill="#0f172a">
            TOP VIEW
          </text>
          {[0, 1, 2].map((col) =>
            [0, 1, 2].map((row) => {
              const filled = !(col === 2 && row === 0) && !(col === 1 && row === 2);
              return (
                <rect
                  key={`t-${col}-${row}`}
                  x={172 + col * 28}
                  y={42 + row * 28}
                  width="28"
                  height="28"
                  fill={filled ? '#e0f2fe' : '#ffffff'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              );
            })
          )}

          {/* RIGHT SIDE VIEW (heights per row: 3, 3, 1) */}
          <text x="312" y="30" fontSize="11" fontWeight="600" fontFamily="monospace" fill="#0f172a">
            RIGHT VIEW
          </text>
          {[0, 1, 2].map((col) =>
            [0, 1, 2].map((row) => {
              const filled =
                (col === 0 && row >= 0) ||
                (col === 1 && row >= 0) ||
                (col === 2 && row === 2);
              return (
                <rect
                  key={`s-${col}-${row}`}
                  x={308 + col * 28}
                  y={42 + row * 28}
                  width="28"
                  height="28"
                  fill={filled ? '#93c5fd' : '#ffffff'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              );
            })
          )}
          <text x="95" y="158" fontSize="10" fontFamily="monospace" fill="#475569">
            3x3x3 Voxel Grid · Find MAXIMUM Possible Unit Cubes
          </text>
        </svg>
      )}

      {diagramType === 'shadow-projection' && (
        <svg
          viewBox="0 0 420 190"
          className="mx-auto h-44 w-full max-w-md"
          role="img"
          aria-label="Solar shadow projection diagram showing vertical poles of height 2m, 4m, and 3m casting shadows at 45 degree solar altitude"
        >
          <rect width="420" height="190" fill="#f8fafc" rx="6" />
          {/* Ground Plane */}
          <line x1="20" y1="155" x2="400" y2="155" stroke="#0f172a" strokeWidth="2.5" />
          {/* Pole 1 (2m) */}
          <line x1="60" y1="155" x2="60" y2="115" stroke="#0f172a" strokeWidth="3.5" />
          <line x1="60" y1="155" x2="100" y2="155" stroke="#64748b" strokeWidth="4" />
          <line
            x1="60"
            y1="115"
            x2="100"
            y2="155"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="48" y="108" fontSize="10" fontFamily="monospace" fill="#0f172a">
            2m
          </text>

          {/* Pole 2 (4m) */}
          <line x1="155" y1="155" x2="155" y2="75" stroke="#0f172a" strokeWidth="3.5" />
          <line x1="155" y1="155" x2="235" y2="155" stroke="#64748b" strokeWidth="4" />
          <line
            x1="155"
            y1="75"
            x2="235"
            y2="155"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="145" y="68" fontSize="10" fontFamily="monospace" fill="#0f172a">
            4m
          </text>

          {/* Pole 3 (3m) near Stepped Wall */}
          <line x1="285" y1="155" x2="285" y2="95" stroke="#0f172a" strokeWidth="3.5" />
          {/* Stepped Wall at x = 320 */}
          <rect
            x="320"
            y="105"
            width="55"
            height="50"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Shadow along ground then climbing vertically up wall */}
          <line x1="285" y1="155" x2="320" y2="155" stroke="#0284c7" strokeWidth="4" />
          <line x1="320" y1="155" x2="320" y2="130" stroke="#0284c7" strokeWidth="4" />
          <line
            x1="285"
            y1="95"
            x2="320"
            y2="130"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="275" y="88" fontSize="10" fontFamily="monospace" fill="#0f172a">
            3m
          </text>
          <text x="326" y="98" fontSize="10" fontFamily="monospace" fill="#0284c7">
            Wall
          </text>
        </svg>
      )}

      {(diagramType === 'part-b-vendor-cart' ||
        diagramType === 'part-b-bus-stop' ||
        diagramType === 'part-b-kitchen-perspective') && (
        <svg
          viewBox="0 0 460 220"
          className="mx-auto h-52 w-full max-w-lg"
          role="img"
          aria-label="Part B perspective composition wireframe guide showing horizon line, foreground counter framing, and focal depth cues"
        >
          <rect width="460" height="220" fill="#ffffff" stroke="#e2e8f0" rx="6" />
          <line
            x1="15"
            y1="92"
            x2="445"
            y2="92"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text x="22" y="85" fontSize="10" fontFamily="monospace" fill="#0284c7">
            EYE-LEVEL HORIZON (VP)
          </text>
          <circle cx="290" cy="92" r="4" fill="#0284c7" />
          <line x1="290" y1="92" x2="40" y2="15" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="290" y1="92" x2="40" y2="205" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="290" y1="92" x2="440" y2="25" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="290" y1="92" x2="440" y2="205" stroke="#cbd5e1" strokeWidth="1" />
          <polygon
            points="15,155 215,142 230,208 15,208"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <ellipse
            cx="95"
            cy="132"
            rx="24"
            ry="18"
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <circle cx="195" cy="88" r="14" fill="none" stroke="#0f172a" strokeWidth="2" />
          <path
            d="M 172 145 Q 195 104 218 145"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <polygon
            points="245,55 430,36 430,138 245,115"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text x="26" y="192" fontSize="10" fontFamily="monospace" fill="#0f172a">
            FG: Heavy Lineweight (4B) · MG: Focal Action · BG: Light Construction (2H)
          </text>
        </svg>
      )}
    </>
  );

  return (
    <>
      <div className="my-4 rounded-lg border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#111827] p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#CBD5E1]">
          <span className="font-medium text-slate-600 dark:text-[#F1F5F9]">
            {mode === 'reference'
              ? 'Reference Composition & Perspective Construction'
              : 'Technical Figure · Zoomable Vector Diagram'}
          </span>

          <div className="flex items-center gap-1">
            <span className="mr-1 hidden font-mono tabular-nums text-slate-400 sm:inline">
              FIG-{(diagramType || 'IMG').toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => cycleZoom(-0.25)}
              disabled={zoomLevel <= 1}
              aria-label="Zoom out diagram"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : zoomLevel === 1.5 ? 2 : 1)}
              className="inline-flex h-7 items-center justify-center rounded border border-slate-200 bg-white px-2 font-mono text-[11px] font-semibold tabular-nums text-slate-700 hover:bg-slate-100"
              title="Tap to cycle zoom (1x -> 1.5x -> 2x)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => cycleZoom(0.25)}
              disabled={zoomLevel >= 2.5}
              aria-label="Zoom in diagram"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                aria-label="Reset diagram zoom"
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="Inspect diagram fullscreen"
              className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden xs:inline">Expand</span>
            </button>
          </div>
        </div>

        {/* Pan/Scroll viewport for zoomed diagrams — preserves clean paper background for technical clarity */}
        <div className="overflow-x-auto overflow-y-auto rounded-md bg-white preserve-light-surface border border-slate-200 p-2">
          <div
            className="mx-auto transition-transform duration-150"
            style={{
              width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%',
              minWidth: zoomLevel > 1 ? `${zoomLevel * 280}px` : undefined,
            }}
          >
            {renderDiagramSvg()}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal for Mobile Detail Inspection */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen diagram inspector"
        >
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-2.5 text-white">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                UCEED Visual Inspector
              </div>
              <div className="text-xs text-slate-300">
                Pinch or use zoom buttons to inspect fine geometric details
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className={`min-h-[38px] rounded px-2.5 text-xs font-mono font-semibold ${
                  zoomLevel === 1 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.5)}
                className={`min-h-[38px] rounded px-2.5 text-xs font-mono font-semibold ${
                  zoomLevel === 1.5 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                1.5x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(2)}
                className={`min-h-[38px] rounded px-2.5 text-xs font-mono font-semibold ${
                  zoomLevel === 2 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl bg-white preserve-light-surface p-4">
            <div
              style={{
                width: `${Math.max(1, zoomLevel) * 100}%`,
                minWidth: zoomLevel > 1 ? `${zoomLevel * 340}px` : undefined,
              }}
            >
              {renderDiagramSvg()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
