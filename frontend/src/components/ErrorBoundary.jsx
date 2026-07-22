import { Component } from 'react';

// Catches render errors and lazy-chunk load failures (a real risk on flaky
// mobile connections, since each page's code now loads on demand) so a
// crash shows a recoverable message instead of a dead white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <p className="text-lg font-semibold text-slate-800">Something went wrong</p>
          <p className="max-w-sm text-sm text-slate-500">
            This can happen after a poor connection interrupted loading. Tap below to reload the app.
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
