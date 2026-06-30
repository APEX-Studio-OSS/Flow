'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the non-fatal exception to local dev console only
    console.error('Root error boundary caught client exception:', error);
  }, [error]);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4 pt-[calc(1rem+var(--safe-area-top))] pb-[calc(1rem+var(--safe-area-bottom))] pl-[calc(1rem+var(--safe-area-left))] pr-[calc(1rem+var(--safe-area-right))] bg-background">
      <Card className="w-full max-w-md border bg-card/60 backdrop-blur-md shadow-lg rounded-3xl p-6 text-center space-y-6">
        <CardHeader className="flex flex-col items-center space-y-3 pb-2">
          <div className="p-4 bg-destructive/10 text-destructive rounded-full">
            <AlertCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            Flow couldn’t load this screen. Try again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full h-12 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary active:scale-98"
          >
            Try again
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full h-12 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary active:scale-98"
          >
            Go home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
