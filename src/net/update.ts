// Service worker registration and updates. The app is cached for offline use, so a new
// deployment reaches an open page only through the service worker. When a new version takes
// over, the page reloads by itself if nothing is lost by it (an empty bench); otherwise the
// app shows a "new version" bar and the user reloads when ready.

const CHECK_EVERY_MS = 20 * 60 * 1000;

export function registerUpdates(isBusy: () => boolean, onReady: () => void) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  // On the very first visit the worker takes control without any new version: no reload then.
  const hadController = !!navigator.serviceWorker.controller;
  let handled = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || handled) return;
    handled = true;
    if (isBusy()) onReady();
    else window.location.reload();
  });
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
    const check = () => { reg.update().catch(() => { /* offline */ }); };
    window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  }).catch(() => { /* builds without a service worker */ });
}
