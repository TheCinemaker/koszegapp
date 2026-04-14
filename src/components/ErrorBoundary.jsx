import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught fatal error:', error, errorInfo);
  }

  handleReset = () => {
    // Clear potentially corrupted storage and reload
    try {
      window.sessionStorage.clear();
      // Keep localStorage for user preferences if possible, or clear only specific ones?
      // For now, let's just reload.
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚧</span>
            </div>
            
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Hoppá, valami elakadt</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
              Az oldal betöltése közben hiba történt (valószínűleg a hálózati kapcsolat megszakadt). Kérlek, próbáld meg frissíteni az oldalt!
            </p>
            
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              🔄 Oldal újratöltése
            </button>
            
            <button 
                onClick={() => window.location.href = '/'}
                className="mt-4 text-xs font-bold text-zinc-400 hover:text-indigo-500 uppercase tracking-widest transition-colors"
            >
                Vissza a főoldalra
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
