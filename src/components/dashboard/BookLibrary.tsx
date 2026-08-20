"use client";

import Link from "next/link";
import { Book } from "@/types/book";
import { ChildProfile } from "@/types/child";
import { Theme } from "@/types/theme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLanguageByCode } from "@/data/languages";
import { resolveCanonicalStage, type LifecycleStage } from "@/lib/book-lifecycle";
import {
  BookOpen,
  Download,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Users,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";

interface BookLibraryProps {
  books: Book[];
  childProfiles: ChildProfile[];
  themes: Theme[];
}

function getChildName(profiles: ChildProfile[], childId: string) {
  return profiles.find((c) => c.id === childId)?.name ?? "Child";
}

function getTheme(themes: Theme[], themeId: string) {
  return themes.find((t) => t.id === themeId);
}

interface StatusDisplay {
  label: string;
  variant: "default" | "destructive";
  className: string;
  icon: typeof Clock;
  animate?: boolean;
}

/**
 * Display config for the exact canonical lifecycle stages. Customer-facing copy
 * (UK English). Internal review stages are shown with reassuring copy but remain
 * the exact canonical stage — no invented steps.
 */
function lifecycleConfig(stage: LifecycleStage): StatusDisplay {
  switch (stage) {
    case "Generated":
      return {
        label: "Story created",
        variant: "default",
        className: "bg-violet-100 text-violet-700 border-violet-200",
        icon: Sparkles,
      };
    case "Under Review":
    case "Changes Requested":
    case "Revised":
      return {
        label: "Being reviewed",
        variant: "default",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: ShieldCheck,
      };
    case "Approved":
      return {
        label: "Approved",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "Ready for Purchase":
      return {
        label: "Ready",
        variant: "default",
        className: "bg-violet-100 text-violet-700 border-violet-200",
        icon: BookOpen,
      };
    case "Purchased":
      return {
        label: "Order confirmed",
        variant: "default",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: PackageCheck,
      };
    case "Delivered":
      return {
        label: "Delivered",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
  }
}

/** Legacy status display — used ONLY when no canonical lifecycle stage exists. */
function legacyStatusConfig(status: Book["status"]): StatusDisplay {
  switch (status) {
    case "complete":
      return {
        label: "Complete",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "preview_ready":
      return {
        label: "Preview Ready",
        variant: "default",
        className: "bg-violet-100 text-violet-700 border-violet-200",
        icon: Sparkles,
      };
    case "generating":
    case "preview_generating":
      return {
        label: "Generating...",
        variant: "default",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Loader2,
        animate: true,
      };
    case "draft":
      return {
        label: "Draft",
        variant: "default",
        className: "bg-gray-100 text-gray-600 border-gray-200",
        icon: Clock,
      };
    case "failed":
      return {
        label: "Failed",
        variant: "destructive",
        className: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      };
    default:
      return {
        label: status,
        variant: "default",
        className: "bg-gray-100 text-gray-600 border-gray-200",
        icon: Clock,
      };
  }
}

/**
 * Resolves the status badge for a book. Prefers the canonical lifecycle stage;
 * only falls back to the legacy operational status when lifecycle_stage is null.
 */
function statusDisplay(book: Book): StatusDisplay {
  if ((book.status as string) === "failed" && !book.lifecycleStage) {
    return legacyStatusConfig(book.status);
  }
  const stage = resolveCanonicalStage(book.lifecycleStage, null);
  if (stage) return lifecycleConfig(stage);
  return legacyStatusConfig(book.status);
}

function BookCard({
  book,
  childName,
  theme,
}: {
  book: Book;
  childName: string;
  theme: Theme | undefined;
}) {
  const config = statusDisplay(book);
  const StatusIcon = config.icon;
  const stage = resolveCanonicalStage(book.lifecycleStage, book.status);
  const isDelivered = stage === "Delivered";
  const isGenerating =
    !book.lifecycleStage &&
    (book.status === "generating" || book.status === "preview_generating");
  const gradientClass = theme?.colorScheme.coverGradient ?? "from-violet-900 to-pink-900";
  const date = new Date(book.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="group overflow-hidden border-violet-100/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-100/40 transition-all duration-300">
      {/* Cover gradient */}
      <div
        className={`relative h-36 bg-gradient-to-br ${gradientClass} flex items-center justify-center overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-3 left-4 w-8 h-8 rounded-full bg-white/20" />
          <div className="absolute bottom-4 right-6 w-6 h-6 rounded-full bg-white/15" />
          <div className="absolute top-8 right-10 w-3 h-3 rounded-full bg-white/25" />
        </div>
        <BookOpen className="h-12 w-12 text-white/60" />
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-gray-900 truncate">
              {theme
                ? theme.titleTemplate.replace("[Child]", childName)
                : "Untitled Book"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {childName} &middot; {date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant={config.variant}
            className={`${config.className} text-xs font-medium border px-2 py-0.5`}
          >
            <StatusIcon
              className={`h-3 w-3 mr-1 ${config.animate ? "animate-spin" : ""}`}
            />
            {config.label}
          </Badge>
          {theme && (
            <span className="text-xs text-gray-400">{theme.name}</span>
          )}
          {book.secondChildProfileId && (
            <Badge
              variant="outline"
              className="text-xs font-medium border-pink-200 bg-pink-50 text-pink-600 px-2 py-0.5"
            >
              <Users className="h-3 w-3 mr-1" />
              Co-heroes
            </Badge>
          )}
          {book.language && book.language !== "en" && (
            <Badge
              variant="outline"
              className="text-xs font-medium border-blue-200 bg-blue-50 text-blue-600 px-2 py-0.5"
            >
              <Globe className="h-3 w-3 mr-1" />
              {getLanguageByCode(book.language)?.name || book.language}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {(isDelivered || (!book.lifecycleStage && book.status === "complete")) &&
          book.pdfUrl && (
            <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-medium text-sm shadow-md shadow-violet-200/50 border-0">
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
              </Button>
            </a>
          )}
        {!book.lifecycleStage && book.status === "preview_ready" && (
          <Link href={`/preview/${book.id}`}>
            <Button
              variant="outline"
              className="w-full rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 font-medium text-sm"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        )}
        {isGenerating && (
          <div className="w-full py-2 text-center text-sm text-amber-600 font-medium">
            <Loader2 className="h-4 w-4 mr-1.5 inline animate-spin" />
            Creating magic...
          </div>
        )}
      </div>
    </Card>
  );
}

export default function BookLibrary({ books, childProfiles, themes }: BookLibraryProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 mb-4">
          <BookOpen className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
          No books yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Create your first personalised storybook and watch your child become the
          hero of their own adventure.
        </p>
        <Link href="/create">
          <Button className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-medium shadow-lg shadow-violet-200/50 border-0 px-6">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Create Your First Book
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {books.map((book) => {
        const primaryName = getChildName(childProfiles, book.childProfileId);
        const secondName = book.secondChildProfileId
          ? getChildName(childProfiles, book.secondChildProfileId)
          : null;
        const displayName = secondName
          ? `${primaryName} & ${secondName}`
          : primaryName;
        return (
          <BookCard
            key={book.id}
            book={book}
            childName={displayName}
            theme={getTheme(themes, book.themeId)}
          />
        );
      })}
    </div>
  );
}
