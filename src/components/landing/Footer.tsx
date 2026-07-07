import Link from "next/link";
import { Mail, Star, Heart } from "lucide-react";

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://starmeestories.com";

const footerLinks = [
  { label: "About", href: `${MARKETING_URL}/about` },
  { label: "Contact", href: `${MARKETING_URL}/contact` },
  { label: "Privacy Policy", href: `${MARKETING_URL}/privacy` },
  { label: "Terms of Service", href: `${MARKETING_URL}/terms` },
];

function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={className} fill="currentColor">
      <polygon points="25,2 29,20 47,20 33,31 38,49 25,38 12,49 17,31 3,20 21,20" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer>
      {/* CTA section — deep purple wave background */}
      <div className="relative bg-[#5E17EB] border-t-[2.5px] border-[#262625] overflow-hidden py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute top-8 left-8 animate-float opacity-50">
          <StarBurst className="w-10 h-10 text-[#FFDE59]" />
        </div>
        <div className="absolute top-12 right-10 animate-float-reverse opacity-40" style={{ animationDelay: "1s" }}>
          <Heart className="w-8 h-8 text-[#CB6CE6] fill-[#CB6CE6]" />
        </div>
        <div className="absolute bottom-10 left-1/4 animate-float opacity-40" style={{ animationDelay: "2s" }}>
          <Star className="w-7 h-7 text-[#FFDE59] fill-[#FFDE59]" />
        </div>
        <div className="absolute bottom-8 right-1/4 animate-spin-slow opacity-30">
          <StarBurst className="w-8 h-8 text-[#CB6CE6]" />
        </div>

        {/* Polka dots */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-[#FFDE59] fill-[#FFDE59]" />
            ))}
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Every kid deserves to be{" "}
            <span className="text-[#FFDE59]">the hero</span>{" "}
            of their own story! 🌟
          </h2>

          <p className="font-body text-lg text-white/80 mb-10 max-w-lg mx-auto">
            Create a magical, personalised storybook your child will treasure
            forever. See a free sample of your child as the hero — no credit card needed.
          </p>

          <Link href="/create">
            <button className="btn-chunky inline-flex items-center gap-3 bg-[#FFDE59] text-[#262625] font-heading font-bold text-xl px-10 py-5">
              <Star className="h-6 w-6 fill-[#262625]" />
              Start Their Story
            </button>
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {["⚡ Preview in about 2 minutes", "🔒 Photo stays private", "💳 No credit card needed"].map((item) => (
              <span key={item} className="font-body font-bold text-sm text-white/60">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#262625]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Logo — back to marketing site */}
            <a href={MARKETING_URL} className="flex items-center">
              <img
                src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
                alt="Starmee Stories"
                className="h-9 w-auto brightness-0 invert"
              />
            </a>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Email */}
            <a
              href="mailto:hello@starmeestories.com"
              className="flex items-center gap-2 font-body text-sm text-white/50 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              hello@starmeestories.com
            </a>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>&copy; {new Date().getFullYear()} Starmee Stories. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Made with <Heart className="h-3 w-3 text-[#CB6CE6] fill-[#CB6CE6]" /> for
              families everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
