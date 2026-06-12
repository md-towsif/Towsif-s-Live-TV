import React from "react";
import { Tv, Maximize } from "lucide-react";

interface HeaderProps {
  onToggleFullscreen: () => void;
}

export default function Header({ onToggleFullscreen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] bg-[#0d1221] border-b border-[#1c2d45] flex items-center justify-between px-5 z-40 shadow-md">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-[#00e5ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)] animate-pulse">
          <Tv className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-orbitron font-extrabold text-[1.25rem] text-[#00e5ff] tracking-widest leading-none">
            TOWSIF LIVE TV
          </div>
          <div className="text-[0.625rem] tracking-[0.25rem] text-slate-400 uppercase font-semibold mt-1">
            Live TV &amp; Sports
          </div>
        </div>
      </div>

      {/* Control indicators */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 px-3 py-1 text-[0.68rem] bg-rose-500/10 text-rose-400 font-bold tracking-wider rounded-full border border-rose-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
          LIVE
        </span>
        <button
          onClick={onToggleFullscreen}
          className="bg-[#111827] hover:bg-[#162032] border border-[#1c2d45] hover:border-[#00e5ff] hover:text-[#00e5ff] transition duration-200 text-slate-300 font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fullscreen</span>
        </button>
      </div>
    </header>
  );
}
