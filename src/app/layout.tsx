import type { Metadata } from "next";
import Link from "next/link";
import { Anton, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import "./glm.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LocalAction Toolkit",
  description: "Useful customer actions for local service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${publicSans.variable} ${plexMono.variable}`}
    >
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
