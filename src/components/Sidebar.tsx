import React, { useState, useMemo, useRef } from "react";
import { Channel } from "../types";
import { CHANNELS, FALLBACK_LOGO } from "../data";
import { Search, Compass, Tv, ListCollapse } from "lucide-react";

interface SidebarProps {
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

export default function Sidebar({ selectedChannel, onSelectChannel }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragInfo.current.isDragging = true;
    dragInfo.current.hasDragged = false;
    dragInfo.current.startX = e.pageX - scrollRef.current.offsetLeft;
    dragInfo.current.scrollLeft = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
    scrollRef.current.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo.current.isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.5; // Drag speed multiplier
    if (Math.abs(walk) > 3) {
      dragInfo.current.hasDragged = true;
    }
    scrollRef.current.scrollLeft = dragInfo.current.scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    dragInfo.current.isDragging = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Dynamically collect unique categories
  const categories = useMemo(() => {
    const list = ["all"];
    CHANNELS.forEach((ch) => {
      if (ch.cat && !list.includes(ch.cat)) {
        list.push(ch.cat);
      }
    });
    return list;
  }, []);

  // Filter channels based on chosen parameters
  const filteredChannels = useMemo(() => {
    return CHANNELS.filter((ch) => {
      const matchQuery = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "all" || ch.cat === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <aside className="w-full md:w-[320px] shrink-0 bg-[#0d1221] border-t md:border-t-0 md:border-l border-[#1c2d45] flex flex-col h-[50vh] md:h-auto overflow-hidden">
      {/* Title & Search Panel */}
      <div className="p-4 border-b border-[#1c2d45] flex-shrink-0">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-orbitron font-bold text-xs text-[#00e5ff] tracking-widest flex items-center gap-2">
            <ListCollapse className="w-4 h-4" />
            CHANNELS ({CHANNELS.length})
          </h3>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search live channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1c2d45] focus:border-[#00e5ff] text-white text-xs placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-4 outline-none transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:shadow-[0_0_12px_rgba(0,229,255,0.1)]"
          />
        </div>
      </div>

      {/* Horizontal Category Pill Bar */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className="flex gap-2.5 px-4 py-2 border-b border-[#1c2d45] overflow-x-auto flex-nowrap scrollbar-none flex-shrink-0 cursor-grab select-none active:cursor-grabbing"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (!dragInfo.current.hasDragged) {
                setSelectedCategory(cat);
              }
            }}
            className={`text-[0.686rem] font-bold tracking-wide px-3.5 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition duration-150 select-none ${
              selectedCategory === cat
                ? "bg-[#00e5ff] border-[#00e5ff] text-black"
                : "bg-transparent border-[#1c2d45] hover:border-slate-500 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {/* Channel Grid/List Wrapper */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChannels.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 flex flex-col items-center gap-3">
            <Compass className="w-8 h-8 text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
            <p className="text-xs">No channels match your query.</p>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap md:flex-col gap-2">
            {filteredChannels.map((ch, idx) => {
              const isSelected = selectedChannel?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChannel(ch)}
                  className={`group flex flex-col md:flex-row items-center md:items-center gap-3 p-3 rounded-xl cursor-pointer border transition duration-150 select-none w-[calc(50%-4px)] sm:w-[calc(33.333%-6px)] md:w-full ${
                    isSelected
                      ? "bg-[#00e5ff]/12 border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.06)]"
                      : "bg-[#111827]/40 border-transparent hover:bg-[#162032] hover:border-[#1c2d45]"
                  }`}
                >
                  {/* Channel Cover thumbnail logo */}
                  <img
                    src={ch.logo || FALLBACK_LOGO}
                    alt={ch.name}
                    className="w-11 h-11 md:w-10 md:h-10 rounded-lg object-contain bg-[#111827] border border-[#1b273d] group-hover:border-[#00e5ff]/40 transition-colors flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO;
                    }}
                    draggable="false"
                  />

                  {/* Channel details metadata */}
                  <div className="min-w-0 flex-1 text-center md:text-left">
                    <div
                      className={`text-[0.76rem] font-semibold truncate transition-colors duration-150 ${
                        isSelected ? "text-[#00e5ff]" : "text-slate-200 group-hover:text-white"
                      }`}
                    >
                      {ch.name}
                    </div>
                    <div className="hidden md:block text-[0.625rem] text-slate-500 group-hover:text-slate-400 mt-1 uppercase font-medium">
                      {ch.cat}
                    </div>
                  </div>

                  {/* Sequential TV channel index number */}
                  <span className="hidden md:inline font-mono text-[0.6rem] font-bold text-slate-600 tracking-wider">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
