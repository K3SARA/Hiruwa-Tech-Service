import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { detectDevice } from "@/lib/device";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const headersList = await headers();
  const device = detectDevice(headersList.get("user-agent"));
  const role = session.user.role;
  const homeForUser = device === "mobile" || role === "SALES" ? "/pos" : "/dashboard";

  redirect(homeForUser);
}
