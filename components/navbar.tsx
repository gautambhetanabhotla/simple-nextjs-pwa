"use client";

import { User2 as UserIcon } from "lucide-react";
import {
  NavigationMenu,
  // NavigationMenuContent,
  // NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  // NavigationMenuTrigger,
  // NavigationMenuViewport,
  // navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function AvatarDropdown() {
  const { data: session } = useSession();
  const router = useRouter();

  // No need for useEffect; React automatically re-renders when `status` changes
  // because `useSession` is a hook and `status` is a state value.

  if (session)
    return (
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{session.user!.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  else
    return (
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => router.push("/login")}
        >
          Sign In
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
}

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-between w-full p-4 border-b">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/grievances">
              Grievances
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/about">About</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback>
              <UserIcon />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <AvatarDropdown />
      </DropdownMenu>
    </div>
  );
}
