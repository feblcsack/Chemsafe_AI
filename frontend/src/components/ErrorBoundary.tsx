"use client";

import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-corrosive/30 bg-corrosive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-corrosive">
              <AlertTriangle size={20} />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-steel text-sm mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={14} />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}