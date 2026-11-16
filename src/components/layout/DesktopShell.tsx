import { auth, signOut } from "@/lib/auth";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";
import { BUSINESS } from "@/lib/business";

export async function DesktopShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-[#0c0d0e]">
        <DesktopSidebar />

        <header className="no-print flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6 py-3 dark:border-zinc-800 dark:bg-[#121316]">
          <div className="flex items-center gap-3">
            <SidebarToggle />
            <div className="sm:hidden flex items-center gap-2">
              <Logo className="h-7 w-auto" />
              <span className="text-xs font-bold text-black dark:text-white truncate max-w-[150px]">
                {BUSINESS.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[120px] sm:max-w-none">
              {session?.user?.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6 dark:bg-[#0c0d0e] print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>

        {/* Mobile bottom nav on smaller screens */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30">
          <MobileNav role={session?.user?.role} />
        </div>

        <Footer />
      </div>
    </SidebarProvider>
  );
}
