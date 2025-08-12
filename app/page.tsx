"use client";

import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/loader";

export default function Home() {
  const { status } = useSession();
  const [manualLoading, setManualLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setManualLoading(false);
    }, 3000);
    if (status === "unauthenticated") router.push("/login");
    return () => clearTimeout(timer);
  }, [status, router]);

  if (status === "loading" || manualLoading) {
    return <Loader />;
  }
  return (
    <>
      <div className="min-h-screen w-full flex flex-col justify-center items-center gap-y-4">
        <p className="text-3xl px-5">What&apos;s bothering you today?</p>
        <div className="w-[85%] max-w-4xl">
          <Textarea placeholder="Describe your grievance..." />
        </div>
      </div>
    </>
  );
}
