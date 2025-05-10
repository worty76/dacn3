"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  return (
    <>
      {!isDashboardRoute && <Navbar />}
      <div className={!isDashboardRoute ? "pt-20" : ""}>{children}</div>
    </>
  );
}
