import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutWrapper } from "@/components/layout";

// Primary font - Poppins
const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-poppins",
});

// Monospace font for code
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MES Admin Portal | Unimore Trading",
  description: "Manufacturing Execution System - Administrative Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="unimore">
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} font-poppins antialiased bg-unimore-white-off text-unimore-navy`}
      >
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
