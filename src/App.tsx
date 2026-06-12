import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Ticker from "./components/Ticker";
import PlayerView from "./components/PlayerView";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import IntroPopup from "./components/IntroPopup";
import { CHANNELS } from "./data";
import { Channel } from "./types";

export default function App() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Playback Toggle callback
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Muting Toggle callback
  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Fullscreen controller
  const handleToggleFullscreen = useCallback(() => {
    const container = appContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.()
        .catch((err) => {
          console.error("Fullscreen request failed", err);
        });
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Select channel helper
  const handleSelectChannel = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setIsPlaying(true);
  }, []);

  // Track natural video playback state updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [selectedChannel]);

  // Global Keyboard Navigation (Space, ArrowUp, ArrowDown, M, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events originating from search text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (selectedChannel) {
            handleTogglePlay();
          }
          break;

        case "KeyM":
          e.preventDefault();
          handleToggleMute();
          break;

        case "KeyF":
          e.preventDefault();
          handleToggleFullscreen();
          break;

        case "ArrowDown": {
          e.preventDefault();
          const currentIndex = selectedChannel 
            ? CHANNELS.findIndex((c) => c.id === selectedChannel.id) 
            : -1;
          const nextIndex = (currentIndex + 1) % CHANNELS.length;
          handleSelectChannel(CHANNELS[nextIndex]);
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          const currentIndex = selectedChannel 
            ? CHANNELS.findIndex((c) => c.id === selectedChannel.id) 
            : -1;
          const prevIndex = currentIndex <= 0 ? CHANNELS.length - 1 : currentIndex - 1;
          handleSelectChannel(CHANNELS[prevIndex]);
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedChannel, handleTogglePlay, handleToggleMute, handleToggleFullscreen, handleSelectChannel]);

  return (
    <div 
      ref={appContainerRef}
      className="min-h-screen bg-[#080c18] font-sans text-slate-100 flex flex-col relative overflow-hidden"
    >
      {/* 1. Header Bar */}
      <Header onToggleFullscreen={handleToggleFullscreen} />

      {/* 2. Slide Ticker marquee */}
      <Ticker />

      {/* 3. Main Split Workspace Body */}
      <main className="flex-1 flex flex-col md:flex-row pt-[100px] pb-[48px] h-screen overflow-hidden">
        {/* Left Side: Video Canvas & Meta */}
        <PlayerView
          selectedChannel={selectedChannel}
          videoRef={videoRef}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* Right Side: Channel Sidebar & Search Filters */}
        <Sidebar
          selectedChannel={selectedChannel}
          onSelectChannel={handleSelectChannel}
        />
      </main>

      {/* 4. Platform stats footer */}
      <Footer />

      {/* 5. Entrance Greetings alert overlay */}
      <IntroPopup />
    </div>
  );
}
