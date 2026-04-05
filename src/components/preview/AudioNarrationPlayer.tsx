"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioNarrationPlayerProps {
  audioUrls: (string | null)[];
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function AudioNarrationPlayer({
  audioUrls,
  currentPage,
  totalPages,
  onPageChange,
  className,
}: AudioNarrationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(false);

  const currentAudioUrl = audioUrls[currentPage] || null;
  const hasAudio = audioUrls.some((url) => url !== null);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    }, 100);
  }, [stopProgressTracking]);

  useEffect(() => {
    setHasError(false);

    if (!currentAudioUrl) {
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      stopProgressTracking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      return;
    }

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    audio.src = currentAudioUrl;
    audio.muted = isMuted;
    setIsLoading(true);
    setProgress(0);
    setDuration(0);

    const shouldAutoStart = autoPlayRef.current;

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      setDuration(audio.duration || 0);
      if (shouldAutoStart) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      stopProgressTracking();
      if (autoPlayRef.current && currentPage < totalPages - 1) {
        onPageChange?.(currentPage + 1);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      startProgressTracking();
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopProgressTracking();
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
      stopProgressTracking();
    };

    const handleStalled = () => {
      setTimeout(() => {
        if (audioRef.current && audioRef.current.readyState < 3) {
          setIsLoading(false);
          setHasError(true);
          setIsPlaying(false);
          stopProgressTracking();
        }
      }, 5000);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("stalled", handleStalled);

    audio.load();

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      stopProgressTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudioUrl, currentPage]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [stopProgressTracking]);

  const togglePlay = () => {
    if (!audioRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const skipForward = () => {
    if (currentPage < totalPages - 1) {
      onPageChange?.(currentPage + 1);
    }
  };

  const skipBack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else if (currentPage > 0) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!hasAudio) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full",
          "bg-gradient-to-br from-[#7C3AED] to-[#9333EA]",
          "text-white shadow-lg shadow-violet-500/25",
          "flex items-center justify-center",
          "hover:scale-105 transition-transform duration-200",
          "ring-4 ring-white",
          className
        )}
        aria-label="Open audio player"
      >
        <Headphones className="h-6 w-6" />
        {isPlaying && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "w-[calc(100%-2rem)] max-w-md",
        "bg-white/95 backdrop-blur-xl",
        "rounded-2xl shadow-2xl shadow-violet-500/10",
        "ring-1 ring-violet-100",
        "p-4",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {currentPage === 0 ? "Cover" : `Page ${currentPage + 1}`}
            </p>
            <p className="text-xs text-gray-500">
              {hasError
                ? "Audio unavailable"
                : autoPlay
                  ? "Auto-play on"
                  : "Read aloud"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              autoPlay
                ? "bg-violet-100 text-[#7C3AED]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            Auto
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Minimize player"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10L8 14L12 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="h-1.5 bg-violet-100 rounded-full cursor-pointer mb-3 group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] rounded-full transition-all duration-100 relative"
          style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[#7C3AED] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 w-10">
          {formatTime(progress)}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={skipBack}
            disabled={currentPage === 0 && (!audioRef.current || progress < 3)}
            className="p-2 text-gray-600 hover:text-[#7C3AED] disabled:text-gray-300 transition-colors"
            aria-label="Previous page"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentAudioUrl || isLoading || hasError}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200",
              hasError
                ? "bg-red-100 text-red-400"
                : currentAudioUrl
                  ? "bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-violet-500/25 hover:scale-105"
                  : "bg-gray-200 text-gray-400"
            )}
            aria-label={hasError ? "Audio unavailable" : isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : hasError ? (
              <VolumeX className="h-5 w-5" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={skipForward}
            disabled={currentPage >= totalPages - 1}
            className="p-2 text-gray-600 hover:text-[#7C3AED] disabled:text-gray-300 transition-colors"
            aria-label="Next page"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 w-10 justify-end">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
