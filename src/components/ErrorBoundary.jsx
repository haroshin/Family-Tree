import React from 'react';
import { AlertCircle, RefreshCw, Trash2, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      // Clear session keys but keep registered users if possible
      sessionStorage.clear();
      localStorage.removeItem('ancestry_active_session_v1');
    } catch (e) {
      console.warn('Reset error:', e);
    }
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070d09] text-amber-100 flex flex-col items-center justify-center p-4 selection:bg-[#740001] selection:text-amber-200">
          <div className="max-w-md w-full bg-[#0d1c12] p-6 rounded-2xl border-2 border-amber-600/70 shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-center font-serif">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold text-amber-300 font-['Cinzel',serif] mb-2">
              Family Tree Encountered an Error
            </h1>

            <p className="text-xs text-amber-200/80 mb-4">
              An unexpected display issue occurred. You can reload the page or reset the view session below.
            </p>

            {this.state.error && (
              <div className="mb-5 p-3 rounded-xl bg-[#050b07] border border-[#23422d] text-left overflow-auto max-h-36">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleHardReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#200d0e] hover:bg-[#321316] text-rose-300 border border-rose-800/60 font-bold text-xs transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Login / Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
