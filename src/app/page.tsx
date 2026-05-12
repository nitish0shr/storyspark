import { redirect } from "next/navigation";

// Marketing site lives at starmeestories.com (WordPress/Elementor).
// This Next.js backend serves app.starmeestories.com — redirect root visitors.
export default function HomePage() {
  redirect("https://starmeestories.com");
}
