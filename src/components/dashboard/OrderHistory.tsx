"use client";

import { Order } from "@/types/order";
import { Book } from "@/types/book";
import { ChildProfile } from "@/types/child";
import { Theme } from "@/types/theme";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface OrderHistoryProps {
  orders: Order[];
  books: Book[];
  childProfiles: ChildProfile[];
  themes: Theme[];
}

function statusConfig(status: Order["status"]) {
  switch (status) {
    case "paid":
    case "fulfilled":
      return {
        label: status === "paid" ? "Paid" : "Fulfilled",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      };
    case "refunded":
      return {
        label: "Refunded",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: RefreshCw,
      };
    case "failed":
      return {
        label: "Failed",
        className: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-600 border-gray-200",
        icon: Clock,
      };
  }
}

function getBookTitle(
  books: Book[],
  profiles: ChildProfile[],
  themes: Theme[],
  bookId: string
) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return "Unknown Book";
  const child = profiles.find((c) => c.id === book.childProfileId);
  const theme = themes.find((t) => t.id === book.themeId);
  if (theme && child) {
    return theme.titleTemplate.replace("[Child]", child.name);
  }
  return child?.name ? `${child.name}'s Book` : "Storybook";
}

function getBookPdfUrl(books: Book[], bookId: string) {
  return books.find((b) => b.id === bookId)?.pdfUrl ?? null;
}

export default function OrderHistory({
  orders,
  books,
  childProfiles,
  themes,
}: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-4">
          <Receipt className="h-7 w-7 text-violet-500" />
        </div>
        <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">
          No orders yet
        </h3>
        <p className="text-sm text-gray-500">
          Your order history will appear here after your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-2">Date</div>
        <div className="col-span-4">Book</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {orders.map((order) => {
        const config = statusConfig(order.status);
        const StatusIcon = config.icon;
        const title = getBookTitle(books, childProfiles, themes, order.bookId);
        const pdfUrl = getBookPdfUrl(books, order.bookId);
        const date = new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const amount = `$${(order.amountCents / 100).toFixed(2)}`;

        return (
          <Card
            key={order.id}
            className="border-violet-100/60 bg-white/80 backdrop-blur-sm hover:shadow-sm transition-shadow"
          >
            {/* Mobile layout */}
            <div className="sm:hidden p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge
                  className={`${config.className} text-xs font-medium border px-2 py-0.5`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                {pdfUrl && (order.status === "paid" || order.status === "fulfilled") && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </div>
              {order.isGift && order.giftRecipientName && (
                <p className="text-xs text-pink-600">
                  Gift for {order.giftRecipientName}
                </p>
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-4 py-3">
              <div className="col-span-2 text-sm text-gray-600">{date}</div>
              <div className="col-span-4">
                <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                {order.isGift && order.giftRecipientName && (
                  <p className="text-xs text-pink-600 mt-0.5">
                    Gift for {order.giftRecipientName}
                  </p>
                )}
              </div>
              <div className="col-span-2 text-sm font-semibold text-gray-900">
                {amount}
              </div>
              <div className="col-span-2">
                <Badge
                  className={`${config.className} text-xs font-medium border px-2 py-0.5`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <div className="col-span-2 text-right">
                {pdfUrl && (order.status === "paid" || order.status === "fulfilled") ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
