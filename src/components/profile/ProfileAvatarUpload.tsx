"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { saveProfile, useProfile } from "@/lib/profile";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function ProfileAvatarUpload() {
  const profile = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;
      // `saveProfile` applies the new avatar optimistically (shows
      // immediately) and persists `avatar_url` to the `profiles` table
      // in the background - see `src/lib/profile.ts`. If the write
      // fails, the cache (and this preview) rolls back automatically.
      saveProfile({ avatar: dataUrl }).catch(() => {
        setError("Couldn't save your new photo. Please try again.");
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto w-fit">
      <div className="group relative flex size-28 items-center justify-center overflow-hidden rounded-full">
        <Image src={profile.avatar} alt={profile.fullName} fill unoptimized className="object-cover" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/55 text-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Change Photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload profile photo"
        />
      </div>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
