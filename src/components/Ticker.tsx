import React from "react";
import { TICKER_MESSAGES } from "../data";

export default function Ticker() {
  const repeatedText = [...TICKER_MESSAGES, ...TICKER_MESSAGES].join("   •   ");

  return (
    <div className="fixed top-[64px] left-0 right-0 h-[36px] bg-[#0d1221] border-b border-[#1c2d45] flex items-center overflow-hidden z-30 select-none">
      <div className="relative w-full flex items-center">
        {/* Continuous animation belt */}
        <div 
          className="whitespace-nowrap flex text-[0.76rem] text-slate-400 font-medium py-1 animate-[marquee_300s_linear_infinite] hover:[animation-play-state:paused]"
          style={{ animationName: "marquee" }}
        >
          <span className="px-4">
            {repeatedText}
          </span>
          <span className="px-4">
            {repeatedText}
          </span>
        </div>
      </div>

      {/* Styled inline keyframes injected directly or setup using React */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
