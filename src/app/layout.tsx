import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalAction Toolkit",
  description: "Useful customer actions for local service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            LocalAction
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
