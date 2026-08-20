"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  BookOpen,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageRenderer from "./PageRenderer";
import DedicationPage from "./DedicationPage";
import PaywallOverlay from "./PaywallOverlay";
import AudioNarrationPlayer from "./AudioNarrationPlayer";
import ThemeAmbiance from "./ThemeAmbiance";

interface BookPage {
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
  audioUrl?: string | null;
}

interface BookViewerProps {
  pages: BookPage[];
  /** Number of pages visible before the paywall slide (only relevant when showPaywall=true) */
  previewPageCount: number;
  /** True when the viewer should show all pages without a paywall */
  isFullAccess?: boolean;
  /** True when the paywall CTA should be shown after the preview pages */
  showPaywall?: boolean;
  childName: string;
  themeId?: string;
  themeTitle?: string;
  bookId: string;
  /** Exact approved version ID — forwarded to PaywallOverlay for checkout */
  versionId?: string;
  /** Opaque access grant token — forwarded to PaywallOverlay for checkout body only.
   *  Must NOT appear in the share URL. */
  accessToken?: string;
  price?: string;
  dedication?: string | null;
}

export default function BookViewer({
  pages,
  previewPageCount,
  isFullAccess = false,
  showPaywall = false,
  childName,
  themeId,
  themeTitle,
  bookId,
  versionId,
  accessToken,
  price,
  dedication,
}: BookViewerProps) {
  const hasDedication = Boolean(dedication && dedication.trim());
  const [currentPage, setCurrentPage] = useState(0);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [showCoverAnim, setShowCoverAnim] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const flipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dedicationOffset = hasDedication ? 1 : 0;

  // Slide layout:
  //   0            = cover
  //   1            = dedication (if any)
  //   1+dedOffset … previewPageCount+dedOffset = story pages
  //   last         = paywall (if showPaywall && !isFullAccess)
  const paywallSlideCount = !isFullAccess && showPaywall ? 1 : 0;
  const totalVisibleSlides =
    Math.min(previewPageCount, pages.length) + 1 + dedicationOffset + paywallSlideCount;

  const isCoverSlide = currentPage === 0;
  const isDedicationSlide = hasDedication && currentPage === 1;
  const pageIndex = isCoverSlide ? 0 : currentPage - dedicationOffset;
  const isPaywallSlide =
    !isFullAccess &&
    showPaywall &&
    !isCoverSlide &&
    !isDedicationSlide &&
    pageIndex >= previewPageCount;
  const isFirstPage = currentPage === 0;
  const isLastSlide = currentPage === totalVisibleSlides - 1;
  const isStorySlide = !isCoverSlide && !isDedicationSlide && !isPaywallSlide;

  // Remaining pages for the paywall copy — we know at most pages.length were sent
  // (preview only), so use a safe lower-bound estimate for the "N more pages" text.
  const remainingPages = Math.max(1, pages.length);

  useEffect(() => {
    const timer = setTimeout(() => setShowCoverAnim(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalVisibleSlides || isFlipping) return;
      setFlipDirection(page > currentPage ? "next" : "prev");
      setIsFlipping(true);
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      flipTimerRef.current = setTimeout(() => {
        setCurrentPage(page);
        setIsFlipping(false);
        flipTimerRef.current = null;
      }, 350);
    },
    [currentPage, totalVisibleSlides, isFlipping],
  );

  const goNext = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goPrev = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, isFullscreen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleShare = async () => {
    // Share URL is always the bare preview URL — the access token must NOT appear here
    const url = `${window.location.origin}/preview/${bookId}`;
    const shareData = {
      title: `${childName}'s Story - Starmee`,
      text: `Check out ${childName}'s personalised storybook!`,
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
      // User cancelled or share failed
    }
  };

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const pageContent = (
    <>
      {isPaywallSlide ? (
        <PaywallOverlay
          bookId={bookId}
          childName={childName}
          remainingPages={remainingPages}
          price={price}
          versionId={versionId}
          accessToken={accessToken}
        />
      ) : isDedicationSlide ? (
        <DedicationPage dedication={dedication!} themeId={themeId} />
      ) : isCoverSlide ? (
        <PageRenderer
          pageNumber={pages[0].pageNumber}
          text={pages[0].text}
          illustrationUrl={pages[0].illustrationUrl}
          isCover={true}
          childName={childName}
          themeTitle={themeTitle}
        />
      ) : isStorySlide && pageIndex >= 0 && pageIndex < pages.length ? (
        <PageRenderer
          pageNumber={pages[pageIndex].pageNumber}
          text={pages[pageIndex].text}
          illustrationUrl={pages[pageIndex].illustrationUrl}
          isCover={false}
          childName={childName}
          themeTitle={themeTitle}
        />
      ) : null}
    </>
  );

  const navigationArrows = (
    <>
      {!isFirstPage && (
        <button
          onClick={goPrev}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-20",
            "h-10 w-10 rounded-full",
            "bg-white/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5",
            "flex items-center justify-center",
            "text-gray-700 hover:text-[#7C3AED] hover:bg-white",
            "transition-all duration-200 hover:scale-105",
            isFullscreen ? "sm:left-4 h-12 w-12" : "sm:-left-5",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className={cn("h-5 w-5", isFullscreen && "h-6 w-6")} />
        </button>
      )}
      {!isLastSlide && (
        <button
          onClick={goNext}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-20",
            "h-10 w-10 rounded-full",
            "bg-white/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5",
            "flex items-center justify-center",
            "text-gray-700 hover:text-[#7C3AED] hover:bg-white",
            "transition-all duration-200 hover:scale-105",
            isFullscreen ? "sm:right-4 h-12 w-12" : "sm:-right-5",
          )}
          aria-label="Next page"
        >
          <ChevronRight className={cn("h-5 w-5", isFullscreen && "h-6 w-6")} />
        </button>
      )}
    </>
  );

  const pageDots = (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5",
        isFullscreen ? "mt-4" : "mt-6",
      )}
    >
      {Array.from({ length: totalVisibleSlides }).map((_, i) => {
        const isActive = i === currentPage;
        const isDedDot = hasDedication && i === 1;
        const dotPageIdx = i - dedicationOffset;
        const isPaywallDot =
          !isFullAccess &&
          showPaywall &&
          !isDedDot &&
          i > 0 &&
          dotPageIdx >= previewPageCount;

        return (
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              isFullscreen ? "h-2.5" : "h-2",
              isActive
                ? cn(isFullscreen ? "w-8" : "w-6", "bg-[#7C3AED]")
                : isDedDot
                  ? cn(
                      isFullscreen ? "w-2.5" : "w-2",
                      "bg-pink-300 hover:bg-pink-400",
                    )
                  : isPaywallDot
                    ? cn(
                        isFullscreen ? "w-2.5" : "w-2",
                        "bg-pink-200 hover:bg-pink-300",
                      )
                    : cn(
                        isFullscreen ? "w-2.5" : "w-2",
                        "bg-violet-200 hover:bg-violet-300",
                      ),
            )}
            aria-label={
              isDedDot
                ? "Dedication"
                : isPaywallDot
                  ? "Unlock more pages"
                  : `Go to page ${i + 1}`
            }
          />
        );
      })}
    </div>
  );

  if (isFullscreen) {
    return (
      <div
        ref={fullscreenRef}
        className="fixed inset-0 z-[100] bg-[#0D0720] flex flex-col items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <ThemeAmbiance themeId={themeId} />

        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all"
          aria-label="Exit fullscreen"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute top-4 left-4 z-30 text-white/60 text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>
            {isPaywallSlide
              ? "Preview complete"
              : isDedicationSlide
                ? "Dedication"
                : `Page ${pageIndex + 1} of ${pages.length}`}
          </span>
        </div>

        <div
          className="relative w-full max-w-xl px-8"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={cn(
              "transition-all duration-[350ms] ease-in-out",
              isFlipping &&
                flipDirection === "next" &&
                "[transform:rotateY(-8deg)_scale(0.95)] opacity-80",
              isFlipping &&
                flipDirection === "prev" &&
                "[transform:rotateY(8deg)_scale(0.95)] opacity-80",
              !isFlipping && "[transform:rotateY(0deg)_scale(1)] opacity-100",
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {pageContent}
          </div>
          {navigationArrows}
        </div>

        {pageDots}

        <p className="hidden sm:block mt-3 text-center text-xs text-white/30">
          Arrow keys to navigate · Esc to exit · F to toggle fullscreen
        </p>

        <AudioNarrationPlayer
          audioUrls={pages.map((p, i) =>
            i < previewPageCount ? (p.audioUrl || null) : null,
          )}
          currentPage={isDedicationSlide ? -1 : pageIndex}
          totalPages={Math.min(previewPageCount, pages.length)}
          onPageChange={(audioIdx) => goToPage(audioIdx + dedicationOffset)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen className="h-4 w-4" />
          <span>
            {isPaywallSlide
              ? "Preview complete"
              : isDedicationSlide
                ? "Dedication"
                : `Page ${pageIndex + 1} of ${pages.length}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-[#7C3AED] gap-1.5"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
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
      </div>

      <div
        ref={containerRef}
        className="relative w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: "1200px" }}
      >
        <div
          className={cn(
            "w-full transition-all duration-[350ms] ease-in-out",
            showCoverAnim &&
              currentPage === 0 &&
              "animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-1000",
            !showCoverAnim &&
              isFlipping &&
              flipDirection === "next" &&
              "[transform:rotateY(-8deg)_scale(0.96)] opacity-70",
            !showCoverAnim &&
              isFlipping &&
              flipDirection === "prev" &&
              "[transform:rotateY(8deg)_scale(0.96)] opacity-70",
            !showCoverAnim &&
              !isFlipping &&
              "[transform:rotateY(0deg)_scale(1)] opacity-100",
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          {pageContent}
        </div>
        {navigationArrows}
      </div>

      {pageDots}

      <p className="hidden sm:block mt-3 text-center text-xs text-gray-400">
        Use arrow keys to navigate · Press F for fullscreen
      </p>

      <AudioNarrationPlayer
        audioUrls={pages.map((p, i) =>
          i < previewPageCount ? (p.audioUrl || null) : null,
        )}
        currentPage={isDedicationSlide ? -1 : pageIndex}
        totalPages={Math.min(previewPageCount, pages.length)}
        onPageChange={(audioIdx) => goToPage(audioIdx + dedicationOffset)}
      />
    </div>
  );
}
