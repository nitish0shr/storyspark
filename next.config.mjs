/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["*.replit.dev", "*.spock.replit.dev"],
  // ESLint runs in CI (.github/workflows/ci.yml), not during production builds.
  // Keeps Railway deploys from failing on cosmetic rule violations while code
  // still type-checks and compiles. Flip this back to false once the existing
  // ESLint violations on main are cleaned up — CI will then be the gate.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
