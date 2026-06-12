import React, { useState, useEffect } from "react";
import { Users, Activity, ExternalLink } from "lucide-react";
import { CHANNELS } from "../data";

export default function Footer() {
  const [onlineCount, setOnlineCount] = useState(4821);
  const [visitCount, setVisitCount] = useState(1284930);

  // Fluctuating metric updates to simulate realistic platform telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineCount((prev) => {
        const variance = Math.floor(Math.random() * 40) - 15;
        const nextVal = prev + variance;
        return nextVal < 1000 ? 1000 : nextVal;
      });

      setVisitCount((prev) => {
        return prev + Math.floor(Math.random() * 4) + 1;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[48px] bg-[#0d1221] border-t border-[#1c2d45] flex items-center justify-between px-4 sm:px-6 z-40 text-[0.67rem] text-slate-500 shadow-md">
      {/* Brand Copyright */}
      <div className="flex items-center gap-1.5 truncate">
        <span>© 2026</span>
        <strong className="text-slate-300 font-bold hover:text-[#00e5ff] cursor-pointer">
          TOWSIF LIVE TV
        </strong>
        <span className="hidden sm:inline">— Free Web Live TV Network</span>
      </div>

      {/* Dynamic Counter Statistics Panels */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1c2d45] rounded-full px-3 py-1 font-medium tracking-wide">
          <span className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse"></span>
          <span>Visits:</span>
          <strong className="text-[#00e5ff] font-bold">{visitCount.toLocaleString()}</strong>
        </div>

        <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1c2d45] rounded-full px-3 py-1 font-medium tracking-wide">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
          <span>Online:</span>
          <strong className="text-emerald-400 font-bold">{onlineCount.toLocaleString()}</strong>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-[#111827] border border-[#1c2d45] rounded-full px-3 py-1 font-medium text-slate-400">
          <span>📡 Total:</span>
          <strong className="text-[#00e5ff] ml-1 font-bold">{CHANNELS.length}</strong>
          <span className="text-slate-500 ml-1">Channels</span>
        </div>
      </div>
    </footer>
  );
}
