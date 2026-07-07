// Error boundary - catches React crashes and shows a friendly error page with reload button
// In dev mode, also shows the error stack trace for debugging
import React, { Component } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  // Triggered when a child component throws an error
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log the error details to console
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  // Reload the entire page
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
          <div className="bg-mesh" />
          <div className="relative z-10 glass-strong p-8 max-w-md w-full rounded-3xl text-center shadow-xl animate-fade-in-up border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
              <AlertOctagon className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Oops! Something went wrong.</h1>
            <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
              We've intercepted a critical application error. Our engineering team has been notified (conceptually). Please refresh the page to continue.
            </p>
            <button 
              onClick={this.handleReload}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition"
            >
              <RefreshCw className="h-4 w-4" /> Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
               <div className="mt-6 text-left bg-red-50 p-4 rounded-xl overflow-auto text-[10px] text-red-800 border border-red-100">
                  <p className="font-bold mb-1">Developer Details:</p>
                  <pre>{this.state.errorInfo.componentStack}</pre>
               </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
