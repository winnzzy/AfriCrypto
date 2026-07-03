import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("CRITICAL: Root element #root not found in DOM even after DOMContentLoaded was expected to fire and a setTimeout(0) deferral.");
    console.error("Document readyState at mount attempt:", document.readyState);
    console.error("Document body outerHTML:", document.body ? document.body.outerHTML : "document.body is null or not available");
    console.error("Document documentElement outerHTML:", document.documentElement ? document.documentElement.outerHTML : "document.documentElement is null");
    throw new Error("Could not find root element to mount to. Ensure a <div id=\"root\"></div> exists in your HTML before the script runs, and that the script correctly waits for DOM readiness.");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Always queue mountApp with DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
    // Defer the mountApp call to the next event loop cycle.
    // This can help in environments where the DOM might not be
    // fully settled/available synchronously with DOMContentLoaded.
    setTimeout(mountApp, 0);
});