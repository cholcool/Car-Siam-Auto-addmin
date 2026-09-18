import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Providers from "@/components/Providers";
import { notoSansThai } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Siam Auto Admin",
  description: "ระบบจัดการเช่ารถ",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="th" suppressHydrationWarning className={notoSansThai.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
