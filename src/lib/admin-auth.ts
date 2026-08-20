export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  const adminEmails = configured
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.error(
      "[admin] ADMIN_EMAILS is not configured - denying admin access.",
    );
    return false;
  }
  return adminEmails.includes(email.toLowerCase());
}