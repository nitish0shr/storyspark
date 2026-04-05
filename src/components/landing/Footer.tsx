import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Camera, MessageCircle, Globe } from "lucide-react";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="relative">
      {/* Final CTA Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-pink-50/50 to-violet-50" />
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-pink-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 max-w-2xl mx-auto leading-tight">
            Every child deserves to be the hero of their own story.
          </h2>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            Create a magical, personalized storybook your child will treasure
            forever.
          </p>
          <Link href="/create">
            <Button
              size="lg"
              className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-base px-8 py-6 shadow-xl shadow-violet-300/40 border-0 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-300/50 hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Create Their Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-violet-100/60 bg-[#FFFBF5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo and copyright */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7C3AED]" />
              <span className="font-heading text-lg font-bold text-[#7C3AED]">
                StorySpark
              </span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[Camera, MessageCircle, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-violet-100 hover:bg-violet-200 flex items-center justify-center text-violet-600 transition-colors"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom line */}
          <div className="mt-6 pt-6 border-t border-violet-100/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} StorySpark. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-pink-400 fill-pink-400" /> for
              families everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
