import React, { ReactNode, ErrorInfo, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global Error Handler
window.onerror = function(message) {
  const bootloader = document.getElementById('bootloader');
  if (bootloader) bootloader.style.display = 'none';
  console.error("Global Runtime Error:", message);
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NEXA CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
            backgroundColor: '#000', 
            color: '#0ff', 
            height: '100dvh', 
            width: '100vw', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            textAlign: 'center',
            zIndex: 99999
        }}>
          <h1 style={{color: 'red', fontSize: '24px', marginBottom: '10px'}}>SYSTEM FAILURE</h1>
          <p style={{color: '#888', fontSize: '12px'}}>{this.state.error?.message || 'Unknown Error'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '20px', padding: '10px 20px', background: 'cyan', border: 'none', fontWeight: 'bold'}}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Ready:', reg.scope))
      .catch(err => console.log('SW Fail:', err));
  });
}

// Mount Logic
const container = document.getElementById('root');
if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    // Fade out bootloader after mount
    setTimeout(() => {
        const bootloader = document.getElementById('bootloader');
        if (bootloader) {
            bootloader.style.opacity = '0';
            setTimeout(() => bootloader.style.display = 'none', 500);
        }
    }, 500);
  } catch (e) {
    console.error("Mount Error:", e);
  }
}