"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-70 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}
