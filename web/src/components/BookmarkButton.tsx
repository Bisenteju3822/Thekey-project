"use client";

import { useState } from "react";
import { useTranslation } from "@/app/providers";

interface BookmarkButtonProps {
  hasSaved: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function BookmarkButton({ hasSaved, onClick, disabled }: BookmarkButtonProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  // When saved + hovered → show "Unsave" in red
  const showUnsave = hasSaved && hovered;

  const label = showUnsave
    ? t("post.unsave")
    : hasSaved
      ? t("post.saved")
      : t("post.save");

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        showUnsave
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : hasSaved
            ? "bg-indigo-100 text-indigo-700"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Bookmark SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={hasSaved && !showUnsave ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
