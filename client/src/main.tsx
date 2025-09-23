import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Show custom update notification
              showUpdateNotification(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              });
            }
          });
        }
      });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Handle offline/online status
      window.addEventListener('online', () => {
        document.body.classList.remove('offline');
        showToast('Back online!', 'success');
      });

      window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        showToast('You are now offline. Some features may be limited.', 'warning');
      });

    } catch (error) {
      console.error('SW registration failed: ', error);
    }
  });
}

// PWA Install Prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});

// Show custom update notification
function showUpdateNotification(onUpdate: () => void) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex justify-between items-center';
  notification.innerHTML = `
    <div>
      <div class="font-medium">New version available!</div>
      <div class="text-sm opacity-90">Tap to update for the latest features</div>
    </div>
    <button class="bg-white text-blue-600 px-3 py-1 rounded font-medium ml-4">Update</button>
  `;

  notification.querySelector('button')?.addEventListener('click', onUpdate);
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 10000);
}

// Show install prompt
function showInstallPrompt() {
  if (!deferredPrompt) return;

  const prompt = document.createElement('div');
  prompt.className = 'fixed bottom-4 left-4 right-4 bg-white border border-gray-200 p-4 rounded-lg shadow-lg z-50';
  prompt.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <div class="font-medium text-gray-900">Install Trip Guide</div>
        <div class="text-sm text-gray-600">Get faster access and offline features</div>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-1 text-gray-600 text-sm">Later</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Install</button>
      </div>
    </div>
  `;

  const laterBtn = prompt.querySelector('button:first-of-type');
  const installBtn = prompt.querySelector('button:last-of-type');

  laterBtn?.addEventListener('click', () => {
    prompt.remove();
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  });

  installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    prompt.remove();
  });

  // Don't show if recently dismissed
  const lastDismissed = localStorage.getItem('installPromptDismissed');
  if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  document.body.appendChild(prompt);
}

// Toast notification utility
function showToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-red-600';
  toast.className = `fixed top-4 left-4 right-4 ${bgColor} text-white p-3 rounded-lg shadow-lg z-50 text-center`;
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

createRoot(document.getElementById("root")!).render(<App />);
