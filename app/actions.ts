"use server";

import webpush from "web-push";
import mongoose from "mongoose";
import Subscription from "@/models/pushsubscription";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authoptions";
import connectToDatabase from "@/lib/mongodb";

webpush.setVapidDetails(
  "mailto:gautamarcturus@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

/**
 * Convert a PushSubscription object to a webpush.PushSubscription object.
 * @param sub - The PushSubscription object to convert.
 * @returns The converted webpush.PushSubscription object.
 */
function PStoWPPS(sub: PushSubscription): webpush.PushSubscription {
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime,
    keys: {
      // @ts-expect-error - TypeScript messes up type checking for PushSubscription and webpush.PushSubscription
      p256dh: sub.keys.p256dh,
      // @ts-expect-error - Same as before
      auth: sub.keys.auth,
    },
  };
}

export async function subscribeUser(sub: PushSubscription, userAgent: string) {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  await Subscription.create({
    ...sub,
    user: mongoose.Types.ObjectId.createFromHexString(session!.user.id),
    userAgent,
  });
  return { success: true };
}

export async function unsubscribeUser(userAgent: string) {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  await Subscription.deleteOne({
    user: mongoose.Types.ObjectId.createFromHexString(session!.user.id),
    userAgent,
  });
  return { success: true };
}

export async function sendNotificationToUser(
  id: mongoose.Types.ObjectId | string,
  message: string,
) {
  if (typeof id === "string") {
    id = mongoose.Types.ObjectId.createFromHexString(id);
  }
  await connectToDatabase();
  const subscriptions = await Subscription.find({
    user: id,
  });
  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  try {
    const promises = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          PStoWPPS(subscription),
          JSON.stringify({
            title: "Grievance portal",
            body: message,
            // icon: "/icon.png",
          }),
        ),
      ),
    );
    return {
      success: promises.every((p) => p.status === "fulfilled"),
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}
