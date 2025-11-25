
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global Error Handler
window.onerror = function(message, source, lineno, colno, error) {
  // Only show full crash report if it's not a minor warning
  if (document.body) {
      document.body.innerHTML = `
        <div style="background:black; color:red; padding:20px; font-family:monospace; height:100vh; display:flex; flex-direction:column; justify-content:center;">
          <h1 style="border-bottom:1px solid red; padding-bottom:10px;">SYSTEM FAILURE</h1>
          <p style="color:cyan;">${message}</p>
          <button onclick="window.location.reload()" style="padding:15px; background:cyan; color:black; border:none; margin-top:20px; font-weight:bold;">REBOOT</button>
        </div>
      `;
  }
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
            fontFamily: 'monospace',
            textAlign: 'center'
        }}>
          <h1 style={{color: 'red', marginBottom: '10px'}}>RUNTIME ERROR</h1>
          <p style={{fontSize: '12px', color: '#ccc'}}>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '30px', padding: '10px 20px', background: '#0ff', color: '#000', border: 'none', fontWeight: 'bold'}}
          >
            REBOOT
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Fail', err));
  });
}

// Robust Mounting
const mount = () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}