"use client";

import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/loader";
import { CameraIcon, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import Combobox from "@/components/ui/combobox";
// import PushNotificationManager from "@/components/pushnotifmanager";
// import PWAInstallPrompt from "@/components/pwainstallprompt";

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: Buffer | null;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [againstUserId, setAgainstUserId] = useState("");
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setManualLoading(false);
    }, 0);
    if (status === "unauthenticated") router.push("/login");
    fetch("/api/user")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setAllUsers(data);
        // console.dir(data);
      });
    return () => clearTimeout(timer);
  }, [status, router]);

  if (status === "loading" || manualLoading) {
    return <Loader />;
  }

  const handleSubmit = async () => {
    setLoading(true);
    // console.log(session!.user.id);
    const response = await fetch("/api/grievances", {
      method: "POST",
      body: JSON.stringify({
        text: description,
        // by: session!.user.id,
        against: againstUserId,
      }),
      // headers: {
      //   "Content-Type": "application/json",
      // },
    });
    if (!response.ok) {
      toast.error("Failed to submit grievance");
    } else {
      toast.success("Submitted grievance");
    }
    setDescription("");
    setLoading(false);
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col justify-center items-center gap-y-4">
        {/* <PushNotificationManager />
        <PWAInstallPrompt /> */}
        <p className="text-3xl px-5">What&apos;s bothering you today?</p>
        <div className="w-[85%] max-w-4xl relative">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your grievance..."
          />
          <div className="absolute bottom-2 right-2 flex items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div>
                  <CameraIcon />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  Photo attachment coming soon!
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>From camera</DropdownMenuItem>
                <DropdownMenuItem>From gallery</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button disabled={loading} onClick={handleSubmit}>
              <ArrowUp />
            </Button>
          </div>
        </div>
        <Combobox
          items={allUsers.map((u) => ({ label: u.name, value: u._id }))}
          value={againstUserId}
          setValue={setAgainstUserId}
          placeholder="Who's bothering you?"
        />
      </div>
    </>
  );
}
