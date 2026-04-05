import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Mail, Star } from "lucide-react";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="relative">
      {/* Final CTA — dark cosmic */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D0720] via-[#160B33] to-[#1A0540] py-24 sm:py-32">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-64 rounded-full bg-violet-600/15 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-pink-600/10 blur-[60px] pointer-events-none" />

        {/* Stars */}
        {[
          [10,20],[25,60],[40,15],[55,45],[70,25],[85,55],[15,80],[60,75],[90,40],[50,5],
        ].map(([x,y],i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, opacity: 0.2 + (i % 4) * 0.1 }}
          />
        ))}

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Rating */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
            ))}
            <span className="text-white/50 text-sm ml-2">500+ families</span>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Every child deserves to be{" "}
            <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent animate-gradient-shift">
              the hero
            </span>{" "}
            of their own story.
          </h2>

          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
            Create a magical, personalized storybook your child will treasure forever.
            Upload a photo and be done in 2 minutes.
          </p>

          <Link href="/create">
            <Button
              size="lg"
              className="group rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 text-white font-bold text-lg px-10 py-8 shadow-2xl shadow-violet-900/60 border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-violet-500/50"
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Create Their Book — It&apos;s Free to Preview
            </Button>
          </Link>

          <p className="mt-5 text-sm text-white/30">
            No credit card required · No account needed · Results in minutes
          </p>
        </div>
      </div>

      {/* Bottom footer bar */}
      <div className="border-t border-violet-100/60 bg-[#FFFBF5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
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

            {/* Contact */}
            <a
              href="mailto:hello@storyspark.com"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              hello@storyspark.com
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-violet-100/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} StorySpark. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-pink-400 fill-pink-400 mx-1" /> for
              families everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
