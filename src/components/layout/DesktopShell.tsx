import { auth, signOut } from "@/lib/auth";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { Footer } from "@/components/layout/Footer";

export async function DesktopShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-[#0c0d0e]">
        <DesktopSidebar />

        <header className="no-print flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-[#121316]">
          <SidebarToggle />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{session?.user?.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="text-sm font-medium text-zinc-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 dark:bg-[#0c0d0e] print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>

        <Footer />
      </div>
    </SidebarProvider>
  );
}
