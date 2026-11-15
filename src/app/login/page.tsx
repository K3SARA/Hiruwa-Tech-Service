import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { BUSINESS } from "@/lib/business";
import { Logo } from "@/components/layout/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl ?? "/",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=CredentialsSignin${callbackUrl ? `&callbackUrl=${callbackUrl}` : ""}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-[#0c0d0e]">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-[#121316]">
        <Logo className="mx-auto h-16 w-auto" />
        <h1 className="mt-3 text-center text-lg font-bold text-black dark:text-white">{BUSINESS.name}</h1>
        <p className="mt-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">Staff sign in</p>

        <form action={authenticate} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </div>

          {error && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Invalid email or password.</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
