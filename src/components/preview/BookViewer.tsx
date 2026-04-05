"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageRenderer from "./PageRenderer";
import PaywallOverlay from "./PaywallOverlay";

interface BookPage {
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
}

interface BookViewerProps {
  pages: BookPage[];
  previewPageCount: number;
  childName: string;
  themeId?: string;
  themeTitle?: string;
  bookId: string;
  price?: string;
}

export default function BookViewer({
  pages,
  previewPageCount,
  childName,
  themeTitle,
  bookId,
  price,
}: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Total visible pages = preview pages + 1 for paywall
  const totalVisibleSlides = Math.min(previewPageCount, pages.length) + 1;
  const isPaywallSlide = currentPage >= previewPageCount;
  const isFirstPage = currentPage === 0;
  const isLastSlide = currentPage === totalVisibleSlides - 1;

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalVisibleSlides) return;
      setDirection(page > currentPage ? "right" : "left");
      setCurrentPage(page);
    },
    [currentPage, totalVisibleSlides]
  );

  const goNext = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goPrev = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes (not vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/preview/${bookId}`;
    const shareData = {
      title: `${childName}'s Story - StorySpark`,
      text: `Check out ${childName}'s personalized storybook!`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setIsShareCopied(true);
        setTimeout(() => setIsShareCopied(false), 2000);
      }
    } catch {
      // User cancelled or share failed, do nothing
    }
  };

  const remainingPages = pages.length - previewPageCount;

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen className="h-4 w-4" />
          <span>
            {isPaywallSlide
              ? `Preview complete`
              : `Page ${currentPage + 1} of ${pages.length}`}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-gray-500 hover:text-[#7C3AED] gap-1.5"
        >
          <Share2 className="h-4 w-4" />
          {isShareCopied ? "Link copied!" : "Share"}
        </Button>
      </div>

      {/* Book container */}
      <div
        ref={containerRef}
        className="relative w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Page content */}
        <div
          key={currentPage}
          className={cn(
            "w-full",
            direction === "right"
              ? "animate-in fade-in slide-in-from-right-4 duration-500"
              : "animate-in fade-in slide-in-from-left-4 duration-500"
          )}
        >
          {isPaywallSlide ? (
            <PaywallOverlay
              bookId={bookId}
              childName={childName}
              remainingPages={remainingPages}
              price={price}
            />
          ) : (
            <PageRenderer
              pageNumber={pages[currentPage].pageNumber}
              text={pages[currentPage].text}
              illustrationUrl={pages[currentPage].illustrationUrl}
              isCover={currentPage === 0}
              childName={childName}
              themeTitle={themeTitle}
            />
          )}
        </div>

        {/* Navigation arrows */}
        {!isFirstPage && (
          <button
            onClick={goPrev}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "h-10 w-10 rounded-full",
              "bg-white/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5",
              "flex items-center justify-center",
              "text-gray-700 hover:text-[#7C3AED] hover:bg-white",
              "transition-all duration-200 hover:scale-105",
              "sm:-left-5"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {!isLastSlide && (
          <button
            onClick={goNext}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "h-10 w-10 rounded-full",
              "bg-white/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5",
              "flex items-center justify-center",
              "text-gray-700 hover:text-[#7C3AED] hover:bg-white",
              "transition-all duration-200 hover:scale-105",
              "sm:-right-5"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Page indicator dots */}
      <div className="mt-6 flex items-center justify-center gap-1.5">
        {Array.from({ length: totalVisibleSlides }).map((_, i) => {
          const isActive = i === currentPage;
          const isPaywall = i >= previewPageCount;

          return (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isActive
                  ? "w-6 bg-[#7C3AED]"
                  : isPaywall
                    ? "w-2 bg-pink-200 hover:bg-pink-300"
                    : "w-2 bg-violet-200 hover:bg-violet-300"
              )}
              aria-label={
                isPaywall
                  ? "Unlock more pages"
                  : `Go to page ${i + 1}`
              }
            />
          );
        })}
      </div>

      {/* Keyboard hint (desktop only) */}
      <p className="hidden sm:block mt-3 text-center text-xs text-gray-400">
        Use arrow keys to navigate
      </p>
    </div>
  );
}
