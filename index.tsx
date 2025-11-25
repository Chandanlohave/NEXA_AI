import React, { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global Error Handler for runtime crashes
window.onerror = function(message, source, lineno, colno, error) {
  const bootloader = document.getElementById('bootloader');
  if (bootloader) bootloader.style.display = 'none';

  console.error("Global Crash:", error);
  // We don't overwrite body here to allow ErrorBoundary to try first, 
  // but we ensure bootloader is gone.
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
            textAlign: 'center',
            zIndex: 99999
        }}>
          <h1 style={{color: 'red', marginBottom: '10px', fontSize: '24px'}}>SYSTEM FAILURE</h1>
          <div style={{border: '1px solid #333', padding: '10px', background: '#111', width: '100%', overflow: 'auto', marginBottom: '20px'}}>
             <p style={{fontSize: '12px', color: '#ccc', margin: 0}}>{this.state.error?.message || 'Unknown Error'}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{padding: '12px 24px', background: '#0ff', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '4px'}}
          >
            REBOOT SYSTEM
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
  try {
    const container = document.getElementById('root');
    if (container) {
      // 1. Remove Bootloader Immediately to prevent "Stuck Loading"
      const bootloader = document.getElementById('bootloader');
      if (bootloader) {
          bootloader.style.opacity = '0';
          setTimeout(() => bootloader.style.display = 'none', 500);
      }

      // 2. Mount React
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </React.StrictMode>
      );
    } else {
        throw new Error("Root container not found");
    }
  } catch (e: any) {
      // PRE-REACT CRASH HANDLER
      const bootloader = document.getElementById('bootloader');
      if (bootloader) bootloader.style.display = 'none';
      
      document.body.innerHTML = `
        <div style="background:black; color:red; padding:20px; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; font-family:monospace;">
          <h1 style="font-size:30px; margin-bottom:20px;">CRITICAL STARTUP ERROR</h1>
          <p style="color:white; background:#222; padding:10px; border:1px solid red;">${e.message}</p>
          <button onclick="window.location.reload()" style="margin-top:30px; padding:15px 30px; background:cyan; border:none; font-weight:bold;">RETRY</button>
        </div>
      `;
      console.error("Mounting Error:", e);
  }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}