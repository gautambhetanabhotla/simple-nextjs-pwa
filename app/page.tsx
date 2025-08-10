"use client";

import { useSession, signOut } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <h1>Welcome to the Grievance Portal</h1>
        <p>
          Please <a href="/login">sign in</a> to continue.
        </p>
      </div>
    );
  }

  // session.user will contain the data you returned from authorize()
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1>Welcome to the Grievance Portal</h1>
        <div className="flex items-center gap-4">
          <span>Hello, {session!.user!.email}</span>
          <Button onClick={() => signOut()}>Sign Out</Button>
        </div>
      </div>
      <Textarea placeholder="Describe your grievance..." />
    </>
  );
}
