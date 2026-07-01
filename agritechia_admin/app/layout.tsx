import React from "react";
import type { Metadata } from "next";
// @ts-ignore: side-effect CSS import without module declarations
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "AgriSense AI",
  description: "Precision Agricultural Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

