import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { haptics } from '../../utils/haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class MobileErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);

    // Trigger error haptic feedback
    haptics.error();

    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for analytics/monitoring
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, you'd send this to an error tracking service
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      console.error('Error logged:', errorData);

      // Store in localStorage for offline debugging
      const storedErrors = JSON.parse(localStorage.getItem('mobile-errors') || '[]');
      storedErrors.push(errorData);

      // Keep only last 10 errors
      if (storedErrors.length > 10) {
        storedErrors.shift();
      }

      localStorage.setItem('mobile-errors', JSON.stringify(storedErrors));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    haptics.buttonPress();

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleGoHome = () => {
    haptics.navigate();
    window.location.href = '/';
  };

  private handleReportError = () => {
    haptics.buttonPress();

    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      component: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    // Create mailto link for error reporting
    const subject = encodeURIComponent('Mobile App Error Report');
    const body = encodeURIComponent(`Error Report:\n\n${JSON.stringify(errorReport, null, 2)}`);
    const mailtoLink = `mailto:support@example.com?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isNetworkError = this.state.error?.message?.includes('fetch') ||
                            this.state.error?.message?.includes('network');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="mobile-card max-w-md w-full text-center">
            <div className="mobile-card-content space-y-6">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h1 className="mobile-heading-2 text-gray-900">
                  {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
                </h1>
                <p className="mobile-body text-gray-600">
                  {isNetworkError
                    ? 'Please check your internet connection and try again.'
                    : 'We\'re sorry, but something unexpected happened. Please try again.'
                  }
                </p>
              </div>

              {/* Error Details (for development) */}
              {this.props.showErrorDetails && this.state.error && (
                <div className="bg-gray-100 p-3 rounded-lg text-left">
                  <div className="mobile-caption text-gray-700 font-medium mb-2">
                    Error Details:
                  </div>
                  <div className="mobile-caption text-gray-600 font-mono text-xs break-all">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="mobile-button-primary w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                    {this.state.retryCount > 0 && ` (${this.state.retryCount}/${this.maxRetries})`}
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="mobile-button-secondary w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>

                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  className="mobile-button-ghost w-full"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              {/* Retry Limit Message */}
              {!canRetry && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="mobile-caption text-yellow-800">
                    Maximum retry attempts reached. Please refresh the page or contact support if the problem persists.
                  </p>
                </div>
              )}

              {/* Network Status */}
              {!navigator.onLine && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="mobile-caption text-red-800">
                    📶 You appear to be offline. Please check your internet connection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useMobileErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error handled by hook:', error);
    haptics.error();

    // Show user-friendly error message
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50 text-center';
    toast.textContent = 'Something went wrong. Please try again.';
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  };

  return { handleError };
}

// Higher-order component version
export function withMobileErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <MobileErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </MobileErrorBoundary>
    );
  };
}