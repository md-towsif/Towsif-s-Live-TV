import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Channel } from "../types";
import { FALLBACK_LOGO } from "../data";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Tv, Settings, Check, Wifi, AlertTriangle } from "lucide-react";

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

  const [levels, setLevels] = useState<{ index: number; name: string; height: number; bitrate: number }[]>([]);
  const [selectedPresetQuality, setSelectedPresetQuality] = useState<string>("Auto"); // Target preset (Auto, 4K, 2K, 1080p, 720p, 480p)
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [hasActualLevels, setHasActualLevels] = useState(false);

  // Helper to force Hls quality selection based on presets (4K, 2K, 1080p, 720p, 480p, Auto)
  const applyQualityPreset = (hlsInstance: Hls, preset: string, parsedLevels: any[]) => {
    if (preset === "Auto") {
      hlsInstance.currentLevel = -1;
      hlsInstance.loadLevel = -1;
      return;
    }

    let targetHeight = 1080;
    if (preset === "4K") targetHeight = 2160;
    else if (preset === "2K") targetHeight = 1440;
    else if (preset === "1080p") targetHeight = 1080;
    else if (preset === "720p") targetHeight = 720;
    else if (preset === "480p") targetHeight = 480;

    if (parsedLevels && parsedLevels.length > 0) {
      // Find closest height level
      let bestIndex = 0;
      let minDifference = Math.abs((parsedLevels[0].height || 480) - targetHeight);

      for (let i = 1; i < parsedLevels.length; i++) {
        const heightVal = parsedLevels[i].height || 480;
        const diff = Math.abs(heightVal - targetHeight);
        if (diff < minDifference) {
          minDifference = diff;
          bestIndex = i;
        }
      }

      hlsInstance.currentLevel = bestIndex;
      hlsInstance.loadLevel = bestIndex;
    }
  };

  const handlePresetQualityChange = (preset: string) => {
    setSelectedPresetQuality(preset);
    setShowQualityMenu(false);

    if (hlsRef.current) {
      applyQualityPreset(hlsRef.current, preset, hlsRef.current.levels);
    }
  };

  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<any>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500); // Hide controls after 2.5 seconds of inactivity
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      setShowControls(false);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, selectedChannel]);

  // Setup stream whenever selected channel changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset specific channel states
    setLevels([]);
    setHasActualLevels(false);
    setIsStalled(false);

    // Fully pause, detach, and purge previous video resources
    const stopPlayback = () => {
      try {
        video.pause();
      } catch (e) {}

      // Detach and destroy HLS instance if it exists
      if (hlsRef.current) {
        try {
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch (e) {}
        hlsRef.current = null;
      }

      // Completely clear video source and trigger reload to stop background downloads
      try {
        video.src = "";
        video.removeAttribute("src");
        video.load();
      } catch (e) {}
    };

    // Always clean up any previously running streams first
    stopPlayback();

    if (!selectedChannel) {
      setIsLoading(false);
      return;
    }

    // Reset player states
    setIsLoading(true);
    setHasError(false);

    const streamUrl = selectedChannel.url;

    // Standard HTML5 Video Event Listeners for clean status indicators
    const onWaiting = () => {
      setIsStalled(true);
    };

    const onPlaying = () => {
      setIsStalled(false);
      setIsLoading(false);
    };

    const onStalled = () => {
      // Normal browser notification of loading delay, do not interrupt stream loading!
      setIsStalled(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onNativeVideoError = () => {
      // Only set error if Hls isn't active or in use
      if (!Hls.isSupported()) {
        setIsLoading(false);
        setHasError(true);
      }
    };

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onNativeVideoError);

    let nativeCanPlayHandler: (() => void) | null = null;
    let nativeErrorHandler: (() => void) | null = null;

    if (Hls.isSupported()) {
      const hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Ensure optimal buffering to avoid micro-stuttering
        backBufferLength: 90,
        maxBufferLength: 30, // 30s buffer is highly responsive for stable play
        maxMaxBufferLength: 60, // Standard max limit
        maxBufferSize: 50 * 1024 * 1024, // 50MB RAM limit for segments
        liveSyncDurationCount: 4, // 4 segments buffer from live point
        liveMaxLatencyDurationCount: 10,
        fragLoadingMaxRetry: 10, // Higher retry count prevents freezing on poor routes
        fragLoadingRetryDelay: 1000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 1000,
      });

      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        // Parse and register available quality levels
        const parsedLevels = hlsInstance.levels.map((lvl: any, index: number) => ({
          index,
          name: lvl.name || (lvl.height ? `${lvl.height}p` : `Level ${index + 1}`),
          height: lvl.height || 0,
          bitrate: lvl.bitrate || 0,
        }));

        setLevels(parsedLevels);
        setHasActualLevels(parsedLevels.length > 1);

        // Apply selected preset constraints
        applyQualityPreset(hlsInstance, selectedPresetQuality, parsedLevels);

        video.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      });

      let mediaErrorCount = 0;
      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, retrying segment load...", data);
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              mediaErrorCount++;
              if (mediaErrorCount <= 3) {
                console.warn(`HLS Media Error (${mediaErrorCount}/3), trying automatic media recovery...`, data);
                hlsInstance.recoverMediaError();
              } else {
                console.error("Consecutive HLS Media Errors failed to recover. Re-initializing stream...", data);
                mediaErrorCount = 0;
                try {
                  hlsInstance.loadSource(streamUrl);
                  hlsInstance.attachMedia(video);
                } catch (e) {
                  setHasError(true);
                  setIsLoading(false);
                }
              }
              break;
            default:
              console.error("Unrecoverable HLS error encountered:", data);
              setIsLoading(false);
              setHasError(true);
              try {
                hlsInstance.destroy();
              } catch (e) {}
              break;
          }
        } else {
          // Non-fatal Hls warning details
          if (data.details === "bufferStalledError") {
            setIsStalled(true);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari and iOS devices that support native HLS
      video.src = streamUrl;
      video.load();

      nativeCanPlayHandler = () => {
        video.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      };

      nativeErrorHandler = () => {
        setIsLoading(false);
        setHasError(true);
      };

      video.addEventListener("canplay", nativeCanPlayHandler);
      video.addEventListener("error", nativeErrorHandler);
    } else {
      setIsLoading(false);
      setHasError(true);
    }

    return () => {
      // Unbind HTML5 events safely
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onNativeVideoError);

      if (nativeCanPlayHandler) {
        video.removeEventListener("canplay", nativeCanPlayHandler);
      }
      if (nativeErrorHandler) {
        video.removeEventListener("error", nativeErrorHandler);
      }
      stopPlayback();
    };
  }, [selectedChannel, videoRef]);

  // Sync mute state on prop change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, videoRef]);

  // Clickaway effect for resolution selector
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowQualityMenu(false);
    };
    if (showQualityMenu) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [showQualityMenu]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4 overflow-y-auto w-full">
      {/* 16:9 Video Canvas Wrapper */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`bg-black group/player transition-all duration-300 ${
          !showControls && isPlaying ? "cursor-none" : "cursor-default"
        } ${
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

            {/* Proactive watchdog route optimizer overlay */}
            {isStalled && !isLoading && !hasError && (
              <div className="absolute top-4 right-4 z-20 bg-[#d97706]/15 border border-[#d97706]/35 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-sans font-extrabold text-[0.62rem] sm:text-xs text-amber-500 tracking-wider">
                  OPTIMIZING BUFFER (NO LAGGING)...
                </span>
              </div>
            )}

            {/* Main Video Component */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
            />

            {/* Center Play Check Overlay (Only show when PAUSED) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                  }}
                  className="pointer-events-auto flex items-center justify-center w-16 h-16 rounded-full bg-black/60 hover:bg-[#00e5ff]/20 border border-white/20 hover:border-[#00e5ff] text-white hover:text-[#00e5ff] shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 transform active:scale-95 focus:outline-none"
                  title="Play"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
              </div>
            )}

            {/* Direct Channel Branding Watermark Over Player */}
            <div 
              className={`absolute bottom-4 left-4 z-10 pointer-events-none bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="w-2 h-2 bg-[#00e5ff] rounded-full animate-ping"></span>
              <span className="font-orbitron font-extrabold text-[0.62rem] sm:text-xs text-white tracking-widest uppercase">
                {selectedChannel.name}
              </span>
            </div>

            {/* Overlay Playback HUD on Hover */}
            <div 
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between transition-opacity duration-300 z-10 ${
                showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
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

              <div className="flex items-center gap-3 relative">
                {/* Custom Resolution Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(!showQualityMenu);
                    }}
                    className={`p-2 bg-[#0d1221] hover:bg-[#1c2d45] border border-white/10 rounded-lg text-white hover:text-[#00e5ff] transition duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                      selectedPresetQuality !== "Auto" ? "text-[#00e5ff] border-[#00e5ff]/35 bg-[#00e5ff]/5" : ""
                    }`}
                    title="Video Quality / Mode Selector"
                  >
                    <Settings className={`w-4 h-4 ${showQualityMenu ? "rotate-45" : ""} transition-transform duration-300`} />
                    <span className="hidden sm:inline-block font-sans">
                      {selectedPresetQuality === "Auto" ? "AUTO" : selectedPresetQuality}
                    </span>
                  </button>

                  {showQualityMenu && (
                    <div 
                      className="absolute bottom-11 right-0 w-44 bg-[#0a0f1d] border border-[#1c2d45] rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md p-1.5 z-50 flex flex-col gap-0.5 animate-fadeIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2.5 py-1 text-[0.62rem] uppercase font-bold tracking-wider text-slate-500 border-b border-[#1c2d45]/60 mb-1 flex items-center justify-between">
                        <span>Quality (A/M)</span>
                        {hasActualLevels ? (
                          <span className="text-[0.55rem] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.2 rounded font-mono">HLS MULTI</span>
                        ) : (
                          <span className="text-[0.55rem] text-slate-400 bg-slate-500/10 px-1.5 py-0.2 rounded font-mono">AUTO TUNED</span>
                        )}
                      </div>

                      {[
                        { key: "Auto", label: "Auto (Adaptive)", badge: "Smooth" },
                        { key: "4K", label: "2160p (4K)", badge: "UHD" },
                        { key: "2K", label: "1440p (2K)", badge: "QHD" },
                        { key: "1080p", label: "1080p FHD", badge: "FHD" },
                        { key: "720p", label: "720p HD", badge: "HD" },
                        { key: "480p", label: "480p SD", badge: "SD" },
                      ].map((item) => {
                        const isSelected = selectedPresetQuality === item.key;
                        const isAvailableInMedia = hasActualLevels 
                          ? item.key === "Auto" || levels.some(lvl => {
                              if (item.key === "4K") return lvl.height >= 2160;
                              if (item.key === "2K") return lvl.height >= 1440;
                              if (item.key === "1080p") return lvl.height >= 1000 && lvl.height < 1440;
                              if (item.key === "720p") return lvl.height >= 700 && lvl.height < 1000;
                              if (item.key === "480p") return lvl.height < 700;
                              return false;
                            })
                          : true; // Display all options to simulate quality level constraint profiles

                        return (
                          <button
                            key={item.key}
                            onClick={() => handlePresetQualityChange(item.key)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition text-xs font-medium cursor-pointer ${
                              isSelected
                                ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20"
                                : "text-slate-300 hover:bg-[#1c2d45]/70 border border-transparent"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#00e5ff]" />}
                              <span className={isSelected ? "font-bold text-[#00e5ff]" : "text-slate-300"}>{item.label}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isSelected 
                                ? "bg-[#00e5ff]/15 text-[#00e5ff]" 
                                : isAvailableInMedia 
                                ? "bg-slate-800 text-slate-400" 
                                : "bg-slate-900 text-slate-600 line-through opacity-40"
                            }`}>
                              {item.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={onToggleFullscreen}
                  className="p-2 bg-[#0d1221] hover:bg-[#1c2d45] border border-white/10 rounded-lg text-white hover:text-[#00e5ff] transition duration-150 cursor-pointer"
                  title={isWebFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isWebFullscreen ? <Minimize2 className="w-4 h-4 text-[#00e5ff]" /> : <Maximize2 className="w-4 h-4" />}
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
