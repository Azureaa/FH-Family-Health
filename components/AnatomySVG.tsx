
import React from 'react';
import { OrganKey } from '../types';
import { ORGAN_MAP } from '../constants';
import { Droplets } from 'lucide-react';

interface AnatomySVGProps {
  onOrganClick: (organ: OrganKey | null) => void;
  activeOrgan: OrganKey | null;
  hasDataMap: Record<string, boolean>;
}

export const AnatomySVG: React.FC<AnatomySVGProps> = ({ onOrganClick, activeOrgan, hasDataMap }) => {
  const getOpacity = (key: OrganKey) => {
    // If no organ is active, keep everything subtle but visible
    if (!activeOrgan) return "opacity-90 grayscale-[0.3] hover:opacity-100 hover:grayscale-0";
    // If this organ is active
    if (activeOrgan === key) return "opacity-100 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-[1.02] z-10";
    // If another organ is active, fade this one out
    return "opacity-10 blur-[1px] grayscale";
  };

  const handleToggle = (key: OrganKey) => {
    onOrganClick(activeOrgan === key ? null : key);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Premium Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-400/10 blur-[80px] rounded-full pointer-events-none" />

      {/* 
         ViewBox Adjustment:
         Zoomed out to create elegant whitespace.
         Figure occupies approx 2/3 height visually.
      */}
      <svg viewBox="-60 -40 360 760" className="h-full w-auto overflow-visible transition-all duration-700 select-none drop-shadow-2xl">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceAlpha" in2="blur" operator="in" result="shadow" />
            <feOffset dx="0" dy="4" />
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.1"/>
            </feComponentTransfer>
            <feMerge> 
                <feMergeNode in="shadow"/>
                <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        {/* 
          Refined Human Silhouette 
          A more natural, gender-neutral medical illustration shape.
        */}
        <g onClick={() => handleToggle('limbs')} className="cursor-pointer group">
          <path 
            d="M120,50 
               C142,50 150,65 150,85 
               C150,98 145,108 140,112 
               C155,116 170,125 178,138 
               C188,155 190,175 188,230 
               C187,245 180,248 172,245 
               L168,220 
               L166,420 
               C166,440 158,450 148,450 
               C138,450 132,440 132,420 
               L130,320 
               L110,320 
               L108,420 
               C108,440 102,450 92,450 
               C82,450 74,440 74,420 
               L72,220 
               L68,245 
               C60,248 53,245 52,230 
               C50,175 52,155 62,138 
               C70,125 85,116 100,112 
               C95,108 90,98 90,85 
               C90,65 98,50 120,50 Z" 
            fill="url(#bodyGradient)" 
            stroke="white"
            strokeWidth="3"
            filter="url(#softShadow)"
            className={`transition-all duration-700 ease-out ${activeOrgan === 'limbs' ? 'stroke-blue-200 fill-blue-50' : 'group-hover:fill-slate-50'}`} 
          />
        </g>

        {/* --- Organs --- */}

        {/* Brain */}
        <g onClick={() => handleToggle('brain')} className={`cursor-pointer transition-all duration-500 transform-gpu ${getOpacity('brain')}`}>
          <path d="M104,82 C104,70 110,64 120,64 C130,64 136,70 136,82 C136,94 130,100 120,100 C110,100 104,94 104,82 Z" fill={ORGAN_MAP.brain.color} className="opacity-80" />
          {/* Shine detail */}
          <path d="M110,75 Q120,68 130,75" stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round" fill="none" />
        </g>

        {/* Lungs */}
        <g onClick={() => handleToggle('lungs')} className={`cursor-pointer transition-all duration-500 transform-gpu ${getOpacity('lungs')}`}>
          {/* Right Lung (Viewer Left) */}
          <path d="M116,135 C102,130 90,135 88,150 C86,170 88,195 94,205 C102,212 114,208 116,195 Z" fill={ORGAN_MAP.lungs.color} className="opacity-80" />
          {/* Left Lung (Viewer Right) */}
          <path d="M124,135 C138,130 150,135 152,150 C154,170 152,195 146,205 C138,212 126,208 124,195 Z" fill={ORGAN_MAP.lungs.color} className="opacity-80" />
        </g>

        {/* Heart - Centered/Left */}
        <g onClick={() => handleToggle('heart')} className={`cursor-pointer transition-all duration-500 transform-gpu ${getOpacity('heart')}`}>
          <path 
            d="M122,160 C135,152 142,162 138,175 C135,185 125,190 120,182 C115,175 112,165 122,160 Z" 
            fill={ORGAN_MAP.heart.color} 
            className="origin-[122px_170px] animate-pulse-soft opacity-90"
          />
        </g>

        {/* Liver */}
        <g onClick={() => handleToggle('liver')} className={`cursor-pointer transition-all duration-500 transform-gpu ${getOpacity('liver')}`}>
          <path d="M96,215 C105,210 120,218 122,228 C122,238 115,245 102,245 C90,242 88,225 96,215 Z" fill={ORGAN_MAP.liver.color} className="opacity-80" />
        </g>

        {/* Digestive System */}
        <g onClick={() => handleToggle('digestive')} className={`cursor-pointer transition-all duration-500 transform-gpu ${getOpacity('digestive')}`}>
          <path d="M115,230 Q135,225 140,245 Q145,260 130,265 Q120,270 110,265 Q105,250 115,230 Z" fill={ORGAN_MAP.digestive.color} className="opacity-80" />
          <path d="M108,268 Q120,260 132,268 Q138,285 125,295 Q115,302 105,295 Q95,285 108,268 Z" fill={ORGAN_MAP.digestive.color} opacity="0.6" />
        </g>
      </svg>
      
      {/* 
         System Toggle Button 
         Centered, floating glass-morphism pill.
      */}
      <div 
        onClick={() => handleToggle('general')} 
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-500 ${getOpacity('general') === "opacity-10 blur-[1px] grayscale" ? "opacity-40 grayscale" : "opacity-100"}`}
      >
        <div className={`px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-md border border-white/50 flex items-center gap-3 group active:scale-95 transition-all hover:bg-white hover:scale-105 ${activeOrgan === 'general' ? 'ring-2 ring-blue-500/20 border-blue-400' : ''}`}>
          <div className="bg-blue-50 p-1.5 rounded-full text-blue-500 group-hover:bg-blue-100 transition-colors">
            <Droplets className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">System</span>
            <span className="text-sm font-bold text-slate-800 leading-tight">Circulatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
