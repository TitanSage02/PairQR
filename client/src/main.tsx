import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __IS_PROD__ = Boolean(((import.meta as any) && (import.meta as any).env && (import.meta as any).env.PROD));
if (__IS_PROD__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// In development, ensure no service worker interferes
if (!__IS_PROD__ && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map(r => r.unregister())))
    .then(() => {
      if (window.caches) {
        return window.caches.keys().then(keys => Promise.all(keys.map(k => window.caches.delete(k))));
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
