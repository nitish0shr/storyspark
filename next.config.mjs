/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["*.replit.dev", "*.spock.replit.dev"],
  // ESLint runs in local dev + (optionally) CI, not during production builds.
  // Keeps deploys from failing on cosmetic rule violations while code still
  // type-checks and compiles. Re-enable once we wire ESLint into CI.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
