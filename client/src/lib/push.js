import { client } from '../api/client';

/**
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** iOS Safari only supports web push from an installed Home Screen PWA. */
export function needsHomeScreenInstall() {
  if (typeof window === 'undefined') return false;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true;
  return isIos && !isStandalone;
}

/**
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export async function registerServiceWorker() {
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Request permission, subscribe, and store the subscription on the API.
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { ok: false, reason: 'Push notifications are not supported in this browser.' };
  }

  if (needsHomeScreenInstall()) {
    return {
      ok: false,
      reason: 'On iPhone, add HeartSync to your Home Screen first, then enable notifications.',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  const { publicKey } = await client('/api/push/vapid-public-key');
  if (!publicKey) {
    return { ok: false, reason: 'Push is not configured on the server.' };
  }

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  try {
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'Could not read push subscription keys.' };
    }

    await client('/api/push/subscribe', {
      body: {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      },
    });

    return { ok: true };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    if (/push service not available/i.test(raw)) {
      return {
        ok: false,
        reason:
          'Browser push service is unavailable. Use Chrome or Edge on https://localhost (not a LAN IP), turn on Windows notifications for the browser, and disable Brave “Block Google services” if you use Brave.',
      };
    }
    if (/permission|denied|not allowed/i.test(raw)) {
      return { ok: false, reason: 'Notification permission was blocked for this site.' };
    }
    return { ok: false, reason: raw || 'Could not subscribe to push.' };
  }
}
