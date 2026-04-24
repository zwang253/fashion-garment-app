import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion Inspiration Library",
  description: "Upload street and retail imagery, auto-classify garments, and search designer annotations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f7f1ea_38%,#efe7dd_100%)] text-stone-900">
        <div className="min-h-full flex flex-col">{children}</div>
      </body>
    </html>
  );
}
