
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";

// This is a temporary loading page that decides where to go.
export default function RootPage() {
  const { isFirstTime } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      const targetPath = window.location.pathname + window.location.search + window.location.hash;
      localStorage.setItem('flow-redirect-target', targetPath);
      window.location.replace('/');
      return;
    }

    if (isFirstTime === undefined) {
      return;
    }

    if (isFirstTime === true) {
      localStorage.removeItem('flow-redirect-target');
      router.replace('/welcome');
    } else {
      const redirectTarget = localStorage.getItem('flow-redirect-target');
      if (redirectTarget && redirectTarget !== '/welcome') {
        localStorage.removeItem('flow-redirect-target');
        router.replace(redirectTarget);
      } else {
        localStorage.removeItem('flow-redirect-target');
        router.replace('/dashboard');
      }
    }
  }, [isFirstTime, router]);

  return null; // Render nothing while we decide where to go
}
