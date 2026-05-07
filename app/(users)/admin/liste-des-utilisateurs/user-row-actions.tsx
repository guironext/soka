"use client";

import { Pencil, UserCog, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type UserRowActionsProps = {
  userId: string;
  /** Larger hit targets for mobile card layout */
  layout?: "default" | "comfortable";
};

export function UserRowActions({
  userId,
  layout = "default",
}: UserRowActionsProps) {
  const comfort = layout === "comfortable";

  return (
    <TooltipProvider delayDuration={280}>
      <div
        className={cn(
          "flex flex-nowrap items-center justify-end gap-0.5",
          comfort && "-mr-1 gap-1",
        )}
        data-user-id={userId}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={comfort ? "icon" : "icon-sm"}
              className={cn(
                "text-blue-700 hover:bg-blue-500/15 dark:text-blue-400",
                comfort &&
                  "size-10 rounded-xl sm:size-9 [&_svg]:size-[1.05rem]",
              )}
              onClick={() => {
                // TODO: editUser(userId)
              }}
            >
              <Pencil className="size-3.5" aria-hidden />
              <span className="sr-only">Modifier</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Modifier</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={comfort ? "icon" : "icon-sm"}
              className={cn(
                "text-amber-800 hover:bg-amber-500/15 dark:text-amber-400",
                comfort &&
                  "size-10 rounded-xl sm:size-9 [&_svg]:size-[1.05rem]",
              )}
              onClick={() => {
                // TODO: deactivateUser(userId)
              }}
            >
              <UserX className="size-3.5" aria-hidden />
              <span className="sr-only">Désactiver</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Désactiver</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={comfort ? "icon" : "icon-sm"}
              className={cn(
                "text-violet-800 hover:bg-violet-500/15 dark:text-violet-400",
                comfort &&
                  "size-10 rounded-xl sm:size-9 [&_svg]:size-[1.05rem]",
              )}
              onClick={() => {
                // TODO: reassignUser(userId)
              }}
            >
              <UserCog className="size-3.5" aria-hidden />
              <span className="sr-only">Réaffecter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Réaffecter</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
