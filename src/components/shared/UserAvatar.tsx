import React from "react"

interface UserAvatarProps {
  user: {
    displayName: string
    color?: string | null
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-5 h-5 text-[10px]",
  md: "w-6 h-6 text-xs",
  lg: "w-8 h-8 text-sm",
}

export function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: user.color || "#6366f1" }}
      title={user.displayName}
    >
      {initials}
    </div>
  )
}
