"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotificationToUser,
} from "@/app/actions";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    });
    setSubscription(sub);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeUser(serializedSub, navigator.userAgent);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser(navigator.userAgent);
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotificationToUser(session!.user.id, message);
      setMessage("");
    }
  }

  return {
    isSupported,
    subscription,
    message,
    setMessage,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  };
}

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installabilityReason, setInstallabilityReason] = useState<
    string | null
  >(null);
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const checkInstallability = useCallback(
    async (isIOSDevice: boolean, isStandalone: boolean) => {
      // If already installed, not installable
      if (isStandalone) {
        setIsInstallable(false);
        setInstallabilityReason("App is already installed");
        return;
      }

      // Check basic requirements
      const hasServiceWorker = "serviceWorker" in navigator;
      const isSecure =
        location.protocol === "https:" || location.hostname === "localhost";

      if (!hasServiceWorker) {
        setIsInstallable(false);
        setInstallabilityReason("Service workers not supported");
        return;
      }

      if (!isSecure) {
        setIsInstallable(false);
        setInstallabilityReason("Requires HTTPS connection");
        return;
      }

      // iOS Safari - check manually
      if (isIOSDevice) {
        const hasManifest = await checkManifestExists();
        setIsInstallable(hasManifest);
        setInstallabilityReason(
          hasManifest
            ? "Installable on iOS"
            : "Missing manifest or requirements",
        );
        return;
      }

      // For other browsers, we'll wait for the beforeinstallprompt event
      // or check if the browser supports it
      const supportsInstallPrompt = "onbeforeinstallprompt" in window;

      if (!supportsInstallPrompt) {
        // Firefox doesn't support beforeinstallprompt yet
        // Check manually for Firefox
        const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
        if (isFirefox) {
          const hasManifest = await checkManifestExists();
          setIsInstallable(hasManifest);
          setInstallabilityReason(
            hasManifest
              ? "Installable on Firefox"
              : "Missing manifest or requirements",
          );
        } else {
          setIsInstallable(false);
          setInstallabilityReason("Not installable in this browser");
        }
        return;
      }

      // For Chromium-based browsers, we'll rely on the beforeinstallprompt event
      // Set initial state - will be updated when/if the event fires
      setInstallabilityReason("Waiting for install prompt...");
    },
    [],
  );

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) && !("MSStream" in window);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;

    setIsIOS(isIOSDevice);
    setIsPWA(isStandalone);

    // Check basic PWA requirements
    checkInstallability(isIOSDevice, isStandalone);
  }, [checkInstallability]);

  const checkManifestExists = async (): Promise<boolean> => {
    try {
      // Check if manifest link exists in the document
      const manifestLink = document.querySelector(
        'link[rel="manifest"]',
      ) as HTMLLinkElement;
      if (!manifestLink) return false;

      // Try to fetch the manifest
      const response = await fetch(manifestLink.href);
      if (!response.ok) return false;

      const manifest = await response.json();

      // Check basic manifest requirements
      const hasName = manifest.name || manifest.short_name;
      const hasIcons = manifest.icons && manifest.icons.length > 0;
      const hasStartUrl = manifest.start_url;
      const hasDisplay = manifest.display && manifest.display !== "browser";

      return !!(hasName && hasIcons && hasStartUrl && hasDisplay);
    } catch (error) {
      console.error("Error checking manifest:", error);
      return false;
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = async (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true); // Chromium browsers - installable if event fires
      setInstallabilityReason("Ready to install");
    };

    const handleAppInstalled = () => {
      setPromptEvent(null);
      setIsInstallable(false);
      setIsPWA(true);
      setInstallabilityReason("App is already installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const prompt = async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;

        if (outcome === "accepted") {
          setPromptEvent(null);
          setIsInstallable(false);
        }
      } catch (error) {
        console.error("Error showing install prompt:", error);
      }
    }
  };

  return {
    prompt,
    isIOS,
    isPWA,
    isInstallable,
    promptEvent: !!promptEvent,
    installabilityReason,
  };
}
