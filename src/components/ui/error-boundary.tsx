'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SafeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('SafeErrorBoundary caught rendering exception:', error, errorInfo);
    }
  }

  private handleGoDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-grow flex items-center justify-center p-6 bg-background/50">
          <Card className="w-full max-w-md border border-destructive/20 bg-card/75 backdrop-blur-md shadow-xl rounded-3xl p-6 text-center space-y-6">
            <CardHeader className="flex flex-col items-center space-y-3 pb-2">
              <div className="p-4 bg-destructive/10 text-destructive rounded-2xl">
                <AlertCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Oops, something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flow encountered a rendering error on this screen. You can try reloading the component or return to the dashboard.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-4 p-3 bg-muted rounded-xl text-[10px] text-left overflow-auto max-h-40 border font-mono">
                  {this.state.error.toString()}
                </pre>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={this.handleRetry}
                className="w-full h-12 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary active:scale-98"
              >
                Retry
              </Button>
              <Button
                onClick={this.handleGoDashboard}
                variant="outline"
                className="w-full h-12 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary active:scale-98"
              >
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
