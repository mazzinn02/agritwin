import React from 'react';
import { PhenologicalStageKey } from '../../lib/gdd-calculator';

interface PlantCanopySvgProps {
  stage: PhenologicalStageKey | string;
  cropType?: string;
  className?: string;
  size?: number;
  glow?: boolean;
}

export const PlantCanopySvg: React.FC<PlantCanopySvgProps> = ({
  stage,
  cropType = 'tomato',
  className = '',
  size = 180,
  glow = true,
}) => {
  // Normalize stage string
  const s = (stage || 'vegetative').toLowerCase();
  const isSeedling = s.includes('seedling') || s.includes('germination');
  const isVegetative = s.includes('vegetative');
  const isFlowering = s.includes('flower');
  const isFruiting = s.includes('fruit') || s.includes('ripen');
  const isHarvest = s.includes('harvest') || s.includes('mature');

  const normalizedCrop = cropType.toLowerCase();
  const isTomato = normalizedCrop.includes('tomato');
  const isLettuce = normalizedCrop.includes('lettuce');
  const isPepper = normalizedCrop.includes('pepper') || normalizedCrop.includes('chilli');
  const isStrawberry = normalizedCrop.includes('strawberry');

  const fruitColor = isTomato ? '#ef4444' : isPepper ? '#dc2626' : isStrawberry ? '#f43f5e' : '#eab308';
  const fruitGlow = isTomato ? '#f87171' : isPepper ? '#f87171' : isStrawberry ? '#fb7185' : '#fde047';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-700 filter drop-shadow-xs"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="stemGrad" x1="100" y1="180" x2="100" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          <linearGradient id="leafGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="leafGradSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="rootGrad" x1="100" y1="165" x2="100" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0.3" />
          </linearGradient>

          <radialGradient id="flowerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#facc15" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="fruitGlowGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="40%" stopColor={fruitGlow} />
            <stop offset="100%" stopColor={fruitColor} />
          </radialGradient>

          <radialGradient id="goldMaturityHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Halo for Harvest or High Stage */}
        {(isHarvest || isFruiting) && (
          <circle cx="100" cy="100" r="85" fill="url(#goldMaturityHalo)" />
        )}

        {/* Ground Soil Substrate Layer - Light SaaS Style */}
        <ellipse cx="100" cy="168" rx="68" ry="12" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
        <ellipse cx="100" cy="168" rx="55" ry="8" fill="#F1F5F9" opacity="0.9" />

        {/* Root Node & Indicators */}
        <g opacity={isSeedling ? "0.9" : "0.7"}>
          <path d="M100 168 Q92 182 86 194" stroke="url(#rootGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M100 168 Q108 184 114 195" stroke="url(#rootGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M100 168 L100 196" stroke="url(#rootGrad)" strokeWidth="3" strokeLinecap="round" />
          {!isSeedling && (
            <>
              <path d="M96 176 Q80 185 74 190" stroke="url(#rootGrad)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M104 176 Q120 185 126 190" stroke="url(#rootGrad)" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* ================= STAGE 1: SEEDLING ================= */}
        {isSeedling && (
          <g className="animate-pulse">
            {/* Seed Coat */}
            <ellipse cx="100" cy="166" rx="6" ry="4" fill="#78350f" />
            {/* Curved Sprout Stem */}
            <path d="M100 166 Q103 140 100 115" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
            {/* Left Cotyledon (Sprout Leaf) */}
            <path
              d="M100 115 C82 110 74 95 85 88 C96 82 100 105 100 115 Z"
              fill="url(#leafGradSecondary)"
              stroke="#059669"
              strokeWidth="1.5"
            />
            {/* Right Cotyledon */}
            <path
              d="M100 115 C118 110 126 95 115 88 C104 82 100 105 100 115 Z"
              fill="url(#leafGradPrimary)"
              stroke="#059669"
              strokeWidth="1.5"
            />
            {/* Dewdrop sparkle */}
            <circle cx="88" cy="94" r="2.5" fill="#38bdf8" />
            <circle cx="89" cy="93" r="1" fill="#ffffff" />
          </g>
        )}

        {/* ================= STAGE 2: VEGETATIVE ================= */}
        {isVegetative && (
          <g>
            {/* Lettuce Rosette vs Upright Stem */}
            {isLettuce ? (
              <g>
                <ellipse cx="100" cy="148" rx="42" ry="20" fill="url(#leafGradPrimary)" opacity="0.9" />
                <path d="M60 145 C45 130 55 105 78 112 C95 118 85 140 60 145 Z" fill="url(#leafGradSecondary)" />
                <path d="M140 145 C155 130 145 105 122 112 C105 118 115 140 140 145 Z" fill="url(#leafGradPrimary)" />
                <circle cx="100" cy="130" r="28" fill="#34d399" stroke="#059669" strokeWidth="2" />
                <circle cx="100" cy="128" r="18" fill="#6ee7b7" />
                <circle cx="100" cy="126" r="9" fill="#a7f3d0" />
              </g>
            ) : (
              <g>
                {/* Central Stem */}
                <path d="M100 168 L100 70" stroke="url(#stemGrad)" strokeWidth="6" strokeLinecap="round" />
                {/* Lateral Stems */}
                <path d="M100 135 Q75 125 65 110" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <path d="M100 135 Q125 125 135 110" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <path d="M100 105 Q78 95 68 80" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <path d="M100 105 Q122 95 132 80" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                {/* Dense Foliage Leaves */}
                <path d="M65 110 C45 100 50 78 72 85 C90 92 80 115 65 110 Z" fill="url(#leafGradPrimary)" />
                <path d="M135 110 C155 100 150 78 128 85 C110 92 120 115 135 110 Z" fill="url(#leafGradSecondary)" />
                <path d="M68 80 C50 68 55 50 75 58 C90 65 82 82 68 80 Z" fill="url(#leafGradSecondary)" />
                <path d="M132 80 C150 68 145 50 125 58 C110 65 118 82 132 80 Z" fill="url(#leafGradPrimary)" />
                {/* Apex Terminal Shoot */}
                <path d="M100 70 C88 55 94 40 100 35 C106 40 112 55 100 70 Z" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
              </g>
            )}
          </g>
        )}

        {/* ================= STAGE 3: FLOWERING ================= */}
        {isFlowering && (
          <g>
            {/* Canopy Stems */}
            <path d="M100 168 L100 60" stroke="url(#stemGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M100 130 Q70 120 58 100" stroke="#10b981" strokeWidth="3" />
            <path d="M100 130 Q130 120 142 100" stroke="#10b981" strokeWidth="3" />
            <path d="M100 95 Q68 85 60 65" stroke="#10b981" strokeWidth="3" />
            <path d="M100 95 Q132 85 140 65" stroke="#10b981" strokeWidth="3" />

            {/* Lush Foliage Base */}
            <ellipse cx="60" cy="98" rx="22" ry="14" fill="url(#leafGradPrimary)" transform="rotate(-25 60 98)" />
            <ellipse cx="140" cy="98" rx="22" ry="14" fill="url(#leafGradSecondary)" transform="rotate(25 140 98)" />
            <ellipse cx="62" cy="65" rx="18" ry="12" fill="url(#leafGradSecondary)" transform="rotate(-30 62 65)" />
            <ellipse cx="138" cy="65" rx="18" ry="12" fill="url(#leafGradPrimary)" transform="rotate(30 138 65)" />

            {/* Glowing Floral Blooms */}
            <g transform="translate(60, 65)">
              <circle cx="0" cy="0" r="14" fill="url(#flowerGlow)" />
              <circle cx="-5" cy="-5" r="4.5" fill="#fef08a" />
              <circle cx="5" cy="-5" r="4.5" fill="#fef08a" />
              <circle cx="-5" cy="5" r="4.5" fill="#fef08a" />
              <circle cx="5" cy="5" r="4.5" fill="#fef08a" />
              <circle cx="0" cy="0" r="3.5" fill="#eab308" />
            </g>

            <g transform="translate(100, 52)">
              <circle cx="0" cy="0" r="16" fill="url(#flowerGlow)" />
              <circle cx="-6" cy="-6" r="5" fill="#fef08a" />
              <circle cx="6" cy="-6" r="5" fill="#fef08a" />
              <circle cx="-6" cy="6" r="5" fill="#fef08a" />
              <circle cx="6" cy="6" r="5" fill="#fef08a" />
              <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
            </g>

            <g transform="translate(140, 65)">
              <circle cx="0" cy="0" r="14" fill="url(#flowerGlow)" />
              <circle cx="-5" cy="-5" r="4.5" fill="#fef08a" />
              <circle cx="5" cy="-5" r="4.5" fill="#fef08a" />
              <circle cx="-5" cy="5" r="4.5" fill="#fef08a" />
              <circle cx="5" cy="5" r="4.5" fill="#fef08a" />
              <circle cx="0" cy="0" r="3.5" fill="#eab308" />
            </g>

            {/* Pollen Particles */}
            <circle cx="90" cy="40" r="1.5" fill="#fef08a" className="animate-ping" />
            <circle cx="115" cy="42" r="1.5" fill="#fef08a" className="animate-pulse" />
          </g>
        )}

        {/* ================= STAGE 4: FRUIT SET / RIPENING ================= */}
        {isFruiting && (
          <g>
            <path d="M100 168 L100 55" stroke="url(#stemGrad)" strokeWidth="7" strokeLinecap="round" />
            <path d="M100 125 Q65 115 50 95" stroke="#065f46" strokeWidth="3.5" />
            <path d="M100 125 Q135 115 150 95" stroke="#065f46" strokeWidth="3.5" />
            <path d="M100 90 Q65 80 55 60" stroke="#065f46" strokeWidth="3" />
            <path d="M100 90 Q135 80 145 60" stroke="#065f46" strokeWidth="3" />

            <ellipse cx="65" cy="90" rx="28" ry="18" fill="url(#leafGradPrimary)" transform="rotate(-15 65 90)" />
            <ellipse cx="135" cy="90" rx="28" ry="18" fill="url(#leafGradSecondary)" transform="rotate(15 135 90)" />
            <ellipse cx="100" cy="65" rx="32" ry="20" fill="url(#leafGradPrimary)" />

            {/* Fruit Cluster Nodes */}
            <g transform="translate(62, 105)">
              <circle cx="0" cy="0" r="13" fill="url(#fruitGlowGrad)" stroke="#ffffff" strokeWidth="1" />
              <path d="M-3 -13 Q0 -16 3 -13" stroke="#15803d" strokeWidth="2.5" />
              <circle cx="-3" cy="-3" r="3.5" fill="#ffffff" opacity="0.6" />
            </g>

            <g transform="translate(100, 85)">
              <circle cx="0" cy="0" r="16" fill="url(#fruitGlowGrad)" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M-4 -16 Q0 -20 4 -16" stroke="#15803d" strokeWidth="3" />
              <circle cx="-4" cy="-4" r="4.5" fill="#ffffff" opacity="0.7" />
            </g>

            <g transform="translate(138, 105)">
              <circle cx="0" cy="0" r="12" fill={fruitColor} opacity="0.9" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="-3" cy="-3" r="3" fill="#ffffff" opacity="0.5" />
            </g>

            <g transform="translate(118, 55)">
              <circle cx="0" cy="0" r="7" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1" />
            </g>
          </g>
        )}

        {/* ================= STAGE 5: HARVEST MATURITY ================= */}
        {isHarvest && (
          <g>
            <path d="M100 168 L100 50" stroke="url(#stemGrad)" strokeWidth="8" strokeLinecap="round" />
            
            <ellipse cx="65" cy="85" rx="32" ry="22" fill="url(#leafGradPrimary)" transform="rotate(-15 65 85)" />
            <ellipse cx="135" cy="85" rx="32" ry="22" fill="url(#leafGradSecondary)" transform="rotate(15 135 85)" />
            <ellipse cx="100" cy="60" rx="38" ry="24" fill="url(#leafGradPrimary)" />

            <g transform="translate(58, 98)">
              <circle cx="0" cy="0" r="15" fill="url(#fruitGlowGrad)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-4" cy="-4" r="4" fill="#ffffff" opacity="0.8" />
            </g>

            <g transform="translate(100, 80)">
              <circle cx="0" cy="0" r="18" fill="url(#fruitGlowGrad)" stroke="#facc15" strokeWidth="2" />
              <circle cx="-5" cy="-5" r="5" fill="#ffffff" opacity="0.85" />
            </g>

            <g transform="translate(142, 98)">
              <circle cx="0" cy="0" r="15" fill="url(#fruitGlowGrad)" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="-4" cy="-4" r="4" fill="#ffffff" opacity="0.8" />
            </g>

            <g transform="translate(100, 118)">
              <circle cx="0" cy="0" r="13" fill="url(#fruitGlowGrad)" stroke="#ffffff" strokeWidth="1" />
              <circle cx="-3" cy="-3" r="3.5" fill="#ffffff" opacity="0.8" />
            </g>

            <polygon points="100,20 103,28 111,28 105,33 107,41 100,36 93,41 95,33 89,28 97,28" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default PlantCanopySvg;
