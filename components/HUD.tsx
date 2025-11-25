import React from 'react';
import { NexaState } from '../types';

interface HUDProps {
  state: NexaState;
  speed: number;
}

const HUD: React.FC<HUDProps> = ({ state, speed }) => {
  // Color Logic
  let primaryColor = '#00f3ff'; // Jarvis Cyan
  
  if (state === NexaState.LISTENING) {
    primaryColor = '#ef4444'; // Red
  } else if (state === NexaState.THINKING) {
    primaryColor = '#f59e0b'; // Amber
  }

  // Pulse Animation for Speaking
  const isSpeaking = state === NexaState.SPEAKING;

  // Calculate durations based on speed multiplier
  const slowDur = 60 / speed;
  const medDur = 40 / speed;
  const fastDur = 20 / speed;

  // Inject styles for animations
  const styles = `
    @keyframes spin-linear {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spin-linear-reverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    @keyframes pulse-speak {
      0%, 100% { filter: drop-shadow(0 0 5px ${primaryColor}); opacity: 1; }
      50% { filter: drop-shadow(0 0 20px ${primaryColor}); opacity: 0.8; }
    }
    .hud-spin-slow {
      animation: spin-linear ${slowDur}s linear infinite;
      transform-origin: center;
    }
    .hud-spin-medium {
      animation: spin-linear-reverse ${medDur}s linear infinite;
      transform-origin: center;
    }
    .hud-spin-fast {
      animation: spin-linear ${fastDur}s linear infinite;
      transform-origin: center;
    }
    .speaking-pulse {
      animation: pulse-speak 1.5s ease-in-out infinite;
    }
  `;

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      <style>{styles}</style>
      
      {/* Container - Further Reduced Size */}
      <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px]">
        
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 500 500">
          <defs>
            <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
               <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
               </feMerge>
            </filter>
          </defs>

          {/* --- LAYER 1: OUTER RULER/TICKS (Clockwise) --- */}
          <g className="hud-spin-slow">
             {/* Base Ring */}
             <circle cx="250" cy="250" r="190" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.4" />
             
             {/* 60 Ticks */}
             {Array.from({ length: 60 }).map((_, i) => (
               <line 
                 key={`tick-${i}`}
                 x1="250" y1="50" 
                 x2="250" y2="65" 
                 stroke={primaryColor} 
                 strokeWidth={i % 5 === 0 ? "3" : "1"} 
                 transform={`rotate(${i * 6} 250 250)`}
                 opacity="0.7"
               />
             ))}
             
             {/* Outer Arc Segments */}
             <path d="M 250,40 A 210,210 0 0,1 460,250" fill="none" stroke={primaryColor} strokeWidth="2" strokeDasharray="20, 10" opacity="0.6" />
             <path d="M 250,460 A 210,210 0 0,1 40,250" fill="none" stroke={primaryColor} strokeWidth="2" strokeDasharray="20, 10" opacity="0.6" />
          </g>

          {/* --- LAYER 2: THICK SEGMENTED RING (Counter-Clockwise) --- */}
          <g className="hud-spin-medium">
             {/* Thick Glow Segments */}
             <path d="M 250,80 A 170,170 0 0,1 420,250" fill="none" stroke={primaryColor} strokeWidth="12" strokeOpacity="0.8" filter="url(#glow-soft)" />
             <path d="M 250,420 A 170,170 0 0,1 80,250" fill="none" stroke={primaryColor} strokeWidth="12" strokeOpacity="0.8" filter="url(#glow-soft)" />
             
             {/* Connecting Thin Lines */}
             <circle cx="250" cy="250" r="170" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.3" />
          </g>

          {/* --- LAYER 3: INNER DETAILED RING (Clockwise) --- */}
          <g className="hud-spin-fast">
             <circle cx="250" cy="250" r="120" fill="none" stroke={primaryColor} strokeWidth="1" strokeDasharray="4, 4" opacity="0.5" />
             
             {/* 3 distinct blocks */}
             <path d="M 250,130 A 120,120 0 0,1 353,190" fill="none" stroke={primaryColor} strokeWidth="6" filter="url(#glow-soft)" />
             <path d="M 250,370 A 120,120 0 0,1 147,310" fill="none" stroke={primaryColor} strokeWidth="6" filter="url(#glow-soft)" />
             <path d="M 130,250 A 120,120 0 0,1 150,170" fill="none" stroke={primaryColor} strokeWidth="6" filter="url(#glow-soft)" />
          </g>

          {/* --- LAYER 4: CENTER CORE (Logo + Status) --- */}
          <g className={isSpeaking ? "speaking-pulse" : ""}>
             {/* Static Circle Framing Logo */}
             <circle cx="250" cy="250" r="95" fill="none" stroke={primaryColor} strokeWidth="2" filter="url(#glow-soft)" />
             <circle cx="250" cy="250" r="88" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.5" />

             {/* MAIN TEXT */}
             <text x="250" y="260" textAnchor="middle" fill={primaryColor} fontSize="46" fontFamily="Orbitron" fontWeight="900" letterSpacing="3" filter="url(#glow-soft)">
               NEXA
             </text>
             
             {/* STATUS TEXT (Below Logo) */}
             <text x="250" y="295" textAnchor="middle" fill={primaryColor} fontSize="14" fontFamily="Rajdhani" fontWeight="bold" letterSpacing="6" opacity="0.9">
                {state}
             </text>
          </g>

        </svg>
      </div>
    </div>
  );
};

export default HUD;