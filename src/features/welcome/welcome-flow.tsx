
'use client';

import { useApp } from '@/components/providers/app-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function WelcomeFlow({ children }: { children: React.ReactNode }) {
    const { accessState } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Safety invariant: redirect immediately at route or state change
    useEffect(() => {
        if (!mounted || accessState === 'initializing' || accessState === 'clearing') return;

        if (accessState === 'requiresOnboarding' && pathname !== '/welcome') {
            router.replace('/welcome');
        } else if (accessState === 'ready' && pathname === '/welcome') {
            router.replace('/dashboard');
        }
    }, [accessState, mounted, pathname, router]);

    // Render neutral background during SSR/hydration and while state is initializing or clearing
    if (!mounted || accessState === 'initializing' || accessState === 'clearing') {
        return <div className="min-h-screen bg-background" />;
    }

    // Safety invariant: block protected app routes from rendering before setup complete
    if (accessState === 'requiresOnboarding' && pathname !== '/welcome') {
        return null;
    }

    // Safety invariant: block welcome screen from rendering if setup is complete
    if (accessState === 'ready' && pathname === '/welcome') {
        return null;
    }

    return <>{children}</>;
}

    
