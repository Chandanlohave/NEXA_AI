import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Error Handler for non-React errors (Script failures, Syntax errors)
window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="background:black; color:red; padding:20px; font-family:monospace; height:100vh;">
      <h1>CRITICAL BOOT FAILURE</h1>
      <p>${message}</p>
      <p>Source: ${source}:${lineno}</p>
      <button onclick="window.location.reload()" style="padding:10px; background:cyan; border:none; margin-top:20px;">RETRY</button>
    </div>
  `;
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ERROR BOUNDARY COMPONENT
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NEXA SYSTEM CRITICAL FAILURE:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
            backgroundColor: '#000', 
            color: '#0ff', 
            height: '100vh', 
            width: '100vw', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: 'monospace',
            textAlign: 'center'
        }}>
          <h1 style={{fontSize: '2rem', marginBottom: '10px', color: 'red', borderBottom: '1px solid red'}}>SYSTEM FAILURE</h1>
          <p style={{color: '#fff', marginBottom: '20px'}}>CRITICAL ERROR DETECTED</p>
          <pre style={{
            marginTop: '20px', 
            color: '#0f0', 
            whiteSpace: 'pre-wrap', 
            maxWidth: '90%', 
            textAlign: 'left', 
            background: '#111', 
            padding: '10px',
            border: '1px solid #333'
          }}>
            {this.state.error ? this.state.error.toString() : "Unknown Error"}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '30px', padding: '15px 30px', background: '#0ff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('NEXA System: ServiceWorker registration successful');
      },
      (err) => {
        console.log('NEXA System: ServiceWorker registration failed: ', err);
      }
    );
  });
}

// Safe Mount Function
const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}