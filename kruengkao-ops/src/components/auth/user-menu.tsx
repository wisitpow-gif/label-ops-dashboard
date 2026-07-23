"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/auth-actions";

/** Header avatar → dropdown showing the signed-in email + a sign-out action. */
export function UserMenu({ email }: { email: string | null }) {
  const initials = email ? email.slice(0, 2).toUpperCase() : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="บัญชีผู้ใช้"
          className="rounded-full"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">
          <span className="block text-xs text-muted-foreground">
            เข้าสู่ระบบในชื่อ
          </span>
          <span className="truncate">{email ?? "—"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* A form posting to a server action — no client fetch needed. */}
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut data-icon="inline-start" />
              ออกจากระบบ
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
