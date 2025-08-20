"use client";

import { useState } from "react";
import { useInstallPrompt, usePushNotifications } from "@/hooks/pwa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PWAInstallCard() {
  const [isLoading, setIsLoading] = useState(false);

  const { prompt, isIOS, isPWA, isInstallable, installabilityReason } =
    useInstallPrompt();

  const handleInstall = async () => {
    setIsLoading(true);
    try {
      await prompt();
    } catch (error) {
      console.error("Failed to install:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          App Installation
          <Badge variant={isPWA ? "default" : "secondary"} className="ml-2">
            {isPWA ? "Installed" : "Not installed"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isPWA
            ? "You're using the installed app!"
            : "Install this app for a better experience!"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Status:</strong>{" "}
            {isPWA ? "Running as installed app" : "Running in browser"}
          </p>
          <p>
            {!isInstallable && (
              <>
                <strong>Can&apos;t install:&nbsp;</strong>
                {installabilityReason}
              </>
            )}{" "}
          </p>
          {isIOS && !isPWA && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📱 Install on iOS:
              </p>
              <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; to install the app</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        {isPWA ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            ✅ App is already installed and running!
          </div>
        ) : isIOS ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            Follow the instructions above to install on iOS.
          </div>
        ) : isInstallable ? (
          <Button
            onClick={handleInstall}
            disabled={!isInstallable || isLoading}
            className="w-full"
          >
            {!isInstallable
              ? "Cannot install on your device"
              : isLoading
                ? "Installing..."
                : "Install App"}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function PushNotificationsCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    isSupported,
    subscription,
    setMessage,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = usePushNotifications();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await subscribeToPush();
    } catch (error) {
      console.error("Failed to subscribe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testMessage.trim()) return;
    setIsLoading(true);
    try {
      setMessage(testMessage);
      await sendTestNotification();
      setTestMessage("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to send test notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = !!subscription;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Push Notifications
          <Badge
            variant={isSubscribed ? "default" : "secondary"}
            className="ml-2"
          >
            {isSubscribed ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isSupported
            ? "Manage your push notification preferences"
            : "Push notifications are not supported in this browser"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Status:</strong>{" "}
            {isSubscribed ? "Subscribed" : "Not subscribed"}
          </p>
          {subscription && (
            <p className="mt-2 break-all">
              <strong>Endpoint:</strong>
              <span className="text-xs font-mono bg-muted p-1 rounded mt-1 block">
                {subscription.endpoint.substring(0, 50)}...
              </span>
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {isSupported ? (
          <>
            {isSubscribed ? (
              <>
                <Button
                  variant="destructive"
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Unsubscribing..." : "Unsubscribe"}
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Send Test</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Send Test Notification</DialogTitle>
                      <DialogDescription>
                        Enter a message to send yourself a test push
                        notification.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="message" className="text-right">
                          Message
                        </Label>
                        <Input
                          id="message"
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          placeholder="Hello from your app!"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSendTest}
                        disabled={!testMessage.trim() || isLoading}
                      >
                        {isLoading ? "Sending..." : "Send Test"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Subscribing..." : "Subscribe to Notifications"}
              </Button>
            )}
          </>
        ) : (
          <Button disabled className="flex-1">
            Not Supported
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center gap-y-4 p-4">
      <div className="w-full max-w-md space-y-4">
        <PushNotificationsCard />
        <PWAInstallCard />
      </div>
    </div>
  );
}
