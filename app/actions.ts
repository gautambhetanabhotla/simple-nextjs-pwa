"use server";

import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Use the web-push library's PushSubscription type
let subscription: webpush.PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  // Convert browser PushSubscription to web-push PushSubscription format
  const p256dh = sub.getKey ? sub.getKey("p256dh") : null;
  const auth = sub.getKey ? sub.getKey("auth") : null;

  subscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: p256dh ? Buffer.from(p256dh).toString("base64url") : "",
      auth: auth ? Buffer.from(auth).toString("base64url") : "",
    },
  };
  // In a production environment, you would want to store the subscription in a database
  // For example: await db.subscriptions.create({ data: sub })
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error("No subscription available");
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Test Notification",
        body: message,
        icon: "/icon.png",
      }),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}
