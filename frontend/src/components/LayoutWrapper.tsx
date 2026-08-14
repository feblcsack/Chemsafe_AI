"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Pages that shouldn't show navigation
  const noNavPages = ["/", "/login", "/signup", "/scan"];
  const showNavigation = !noNavPages.includes(pathname);

  return (
    <>
      {showNavigation && <Navigation currentPath={pathname} />}
      {children}
    </>
  );
}