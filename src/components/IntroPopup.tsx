import React, { useEffect, useState } from "react";
import { Sparkles, X, Tv } from "lucide-react";

export default function IntroPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Deliver welcome announcement modal shortly after mount
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Listen to escape key event to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Dim Blur overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-[#04060b]/80 backdrop-blur-md animate-fade-in"
      />

      {/* Main Card Content Box */}
      <div className="relative bg-[#111827] border border-[#1c2d45] rounded-2xl w-full max-w-md shadow-[0_24px_70px_rgba(0,0,0,0.8)] z-10 overflow-hidden transform scale-100 transition-all duration-300">
        {/* Colorful top border line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-[#00e5ff] to-cyan-500"></div>

        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#1c2d45]">
          <h3 className="font-orbitron font-extrabold text-[0.8rem] tracking-wider text-[#00e5ff] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            WELCOME TO TOWSIF LIVE TV
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg border border-[#1c2d45] bg-[#0d1221] hover:border-[#00e5ff] text-slate-400 hover:text-[#00e5ff] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Dismiss welcome overlay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body area */}
        <div className="p-5 text-slate-300">
          <div className="p-4 rounded-xl bg-[#0d1221]/80 border border-[#1c2d45] mb-5">
            <div className="flex gap-3">
              <Tv className="w-5 h-5 text-[#00e5ff] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs leading-relaxed text-slate-300">
                  🎉 Watch over **100+ Free Live Channels** online anytime. Experience premium coverage spanning **Sports, FIFA World Cup, News, Cinematic Movies, and Cartoon Classics**.
                </p>
                <p className="text-[0.686rem] text-slate-500 mt-2.5">
                  Follow us to receive stream status alerts, request missing channels, or report technical difficulties!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive follow link block acting as advertisement or engagement prompt */}
          <a
            href="https://www.facebook.com/towsif.fb"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-gradient-to-r from-cyan-500 to-[#00e5ff] text-black font-extrabold text-xs py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:brightness-110 active:scale-98 transition duration-150"
          >
            Join Our Facebook Community Network
          </a>
        </div>
      </div>
    </div>
  );
}
