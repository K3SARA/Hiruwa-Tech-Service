import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectDevice } from "@/lib/device";
import { BUSINESS } from "@/lib/business";
import { Logo } from "@/components/layout/Logo";
import { LoginSubmitButton } from "@/components/auth/LoginSubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  // If already authenticated, redirect straight to the destination
  const session = await auth();
  if (session?.user) {
    const headersList = await headers();
    const device = detectDevice(headersList.get("user-agent"));
    const homeForUser = device === "mobile" || session.user.role === "SALES" ? "/pos" : "/dashboard";
    redirect(callbackUrl ?? homeForUser);
  }

  async function authenticate(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string | null)?.trim().toLowerCase();
    const password = formData.get("password") as string | null;

    if (!email || !password) {
      redirect(`/login?error=CredentialsSignin${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
    }

    const headersList = await headers();
    const device = detectDevice(headersList.get("user-agent"));

    let target = callbackUrl;
    if (!target || target === "/" || target === "/login") {
      const user = await prisma.user.findUnique({ where: { email } });
      target = device === "mobile" || user?.role === "SALES" ? "/pos" : "/dashboard";
    }

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=CredentialsSignin${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
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
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </div>

          {error && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Invalid email or password.</p>}

          <LoginSubmitButton />
        </form>
      </div>
    </div>
  );
}
