import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  imageUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export function ProfileAvatar({
  imageUrl,
  name,
  size = 40,
  className,
}: ProfileAvatarProps) {
  const dimension = `${size}px`;
  const iconSize = Math.max(16, size * 0.5);

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center overflow-hidden border",
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name ?? "Profile avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <UserIcon
          className="text-muted-foreground"
          style={{ width: iconSize, height: iconSize }}
        />
      )}
    </div>
  );
}
