import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: {
    default: "Inventory & Order Management",
    template: "%s · Inventory & Orders",
  },
  description:
    "Production-ready inventory and order management system: track products, customers, stock and orders.",
  applicationName: "Inventory & Orders",
  robots: { index: false, follow: false }, // internal app; flip to true if public
  openGraph: {
    title: "Inventory & Order Management",
    description: "Manage products, customers, and orders in one place.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b6cff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
