import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "kasBus – krepšinio lankomumas",
    template: "%s · kasBus",
  },
  description: "Treniruočių ir varžybų lankomumas be „+“ žinučių Messenger’yje.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt">
      <body className={`${geistSans.variable} min-h-dvh bg-muted/40 font-sans antialiased`}>
        <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
