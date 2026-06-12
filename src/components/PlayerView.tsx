import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Channel } from "../types";
import { FALLBACK_LOGO } from "../data";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Tv } from "lucide-react";

interface PlayerViewProps {
  selectedChannel: Channel | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  isWebFullscreen: boolean;
}

export default function PlayerView({
  selectedChannel,
  videoRef,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
  onToggleFullscreen,
  isWebFullscreen,
}: PlayerViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hlsRef = useRef<Hls | null>(null);

  // Setup stream whenever selected channel changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedChannel) {
      setIsLoading(false);
      return;
    }

    // Reset player state
    setIsLoading(true);
    setHasError(false);

    // Destroy existing hls.js instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = selectedChannel.url;

    if (Hls.isSupported()) {
      const hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(() => {
            // Playback might be blocked by browser autoplay policy, remove loading overlay anyway
            setIsLoading(false);
          });
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hlsInstance.recoverMediaError();
              break;
            default:
              setIsLoading(false);
              setHasError(true);
              hlsInstance.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari and iOS devices that support native HLS
      video.src = streamUrl;
      video.load();

      const handleCanPlay = () => {
        video.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      };

      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      };
    } else {
      setIsLoading(false);
      setHasError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, videoRef]);

  // Sync mute state on prop change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, videoRef]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4 overflow-y-auto w-full">
      {/* 16:9 Video Canvas Wrapper */}
      <div 
        className={`bg-black group/player transition-all duration-300 ${
          isWebFullscreen
            ? "fixed inset-0 w-screen h-screen z-[99999] rounded-none border-none shadow-none"
            : "relative w-full aspect-video rounded-2xl border border-[#1c2d45] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
        }`}
      >
        {!selectedChannel ? (
          /* Empty/Idle channel State */
          <div className="absolute inset-0 bg-gradient-to-tr from-[#080c18] to-[#0f1b32] flex flex-col items-center justify-center gap-4 text-center px-4 z-10">
            <div className="p-5 rounded-2xl bg-[#0d1221] border border-[#1c2d45] shadow-lg text-slate-500 animate-pulse">
              <Tv className="w-12 h-12 text-[#00e5ff]" />
            </div>
            <h3 className="text-lg font-orbitron font-bold text-[#e2e8f0]">Select a Channel</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Explore and click any TV Channel from the sidebar grid to begin standard live web transmission.
            </p>
          </div>
        ) : (
          /* Video Renderer and Loading Screens */
          <>
            {/* Loading screen overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-[#080c18]/95 flex flex-col items-center justify-center gap-5 z-20">
                <div className="relative">
                  <img
                    src={selectedChannel.logo || FALLBACK_LOGO}
                    alt={selectedChannel.name}
                    className="w-16 h-16 rounded-xl object-contain border-2 border-[#00e5ff] bg-[#111827] shadow-[0_0_25px_rgba(0,229,255,0.4)] animate-bounce"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO;
                    }}
                  />
                  <div className="absolute -inset-1 rounded-xl bg-[#00e5ff]/20 animate-ping -z-10"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-[#1c2d45] border-t-[#00e5ff] animate-spin"></div>
                  <span className="text-xs font-semibold tracking-wider text-slate-300">
                    CONNECTING STREAM...
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-200 text-center px-4 max-w-xs truncate">
                  {selectedChannel.name}
                </div>
              </div>
            )}

            {/* Error state fallback overlay */}
            {hasError && (
              <div className="absolute inset-0 bg-[#0c0d14] flex flex-col items-center justify-center gap-3 text-center px-6 z-15">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
                  ✕
                </div>
                <h4 className="text-base font-bold text-rose-400">Stream Currently Offline</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  This broadcast channel server isn't responding right now. Please select another channel or try again later.
                </p>
              </div>
            )}

            {/* Main Video Component */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black cursor-pointer"
              playsInline
              onClick={onTogglePlay}
            />

            {/* Direct Channel Branding Watermark Over Player */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00e5ff] rounded-full animate-ping"></span>
              <span className="font-orbitron font-extrabold text-[0.62rem] sm:text-xs text-white tracking-widest uppercase">
                {selectedChannel.name}
              </span>
            </div>

            {/* Overlay Playback HUD on Hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={onTogglePlay}
                  className="p-2 bg-[#0d1221] hover:bg-[#1c2d45] border border-white/10 rounded-lg text-white hover:text-[#00e5ff] transition duration-150 cursor-pointer"
                  title="Play / Pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={onToggleMute}
                  className="p-2 bg-[#0d1221] hover:bg-[#1c2d45] border border-white/10 rounded-lg text-white hover:text-[#00e5ff] transition duration-150 cursor-pointer"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 bg-[#0d1221] hover:bg-[#1c2d45] border border-white/10 rounded-lg text-white hover:text-[#00e5ff] transition duration-150 cursor-pointer animate-pulse"
                  title={isWebFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isWebFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Now Playing Metadata Panel */}
      {selectedChannel && (
        <div className="bg-[#0b0e1a] border border-[#1c2d45]/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4.5 w-full md:w-auto">
            <img
              src={selectedChannel.logo || FALLBACK_LOGO}
              alt={selectedChannel.name}
              className="w-12 h-12 rounded-xl object-contain border border-[#1c2d45] bg-[#111827] flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
            <div className="min-w-0">
              <h4 className="text-[#e2e8f0] font-bold text-sm tracking-wide truncate">
                {selectedChannel.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[0.686rem] text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/10">
                  {selectedChannel.cat}
                </span>
                <span className="flex items-center gap-1 text-[0.68rem] text-rose-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block animate-pulse"></span>
                  LIVE STREAM
                </span>
              </div>
            </div>
          </div>

          {/* Device Shortcuts Box */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            <span className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-wider mr-2">
              Hotkeys:
            </span>
            <kbd className="px-2 py-1 bg-[#111827] border border-[#1b253b] rounded text-[0.67rem] text-slate-400 font-mono shadow">
              [Space] play/pause
            </kbd>
            <kbd className="px-2 py-1 bg-[#111827] border border-[#1b253b] rounded text-[0.67rem] text-slate-400 font-mono shadow">
              [↑ ↓] prev/next
            </kbd>
            <kbd className="px-2 py-1 bg-[#111827] border border-[#1b253b] rounded text-[0.67rem] text-slate-400 font-mono shadow">
              [F] fullscreen
            </kbd>
            <kbd className="px-2 py-1 bg-[#111827] border border-[#1b253b] rounded text-[0.67rem] text-slate-440 font-mono shadow">
              [M] mute
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}
