import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace/Workspace";
import type { CatalogLabels } from "@/lib/catalog";
import { CATALOG } from "@/lib/catalog-server";
import { getDb, listJobs } from "@/lib/db";
import { SESSION_COOKIE, verifySession, sessionSecret } from "@/lib/auth";

export const dynamic = "force-dynamic";

// names only: the full catalog (with schemas) is fetched by the composer when needed
const CATALOG_LABELS: CatalogLabels = Object.fromEntries(CATALOG.map((e) => [e.id, { family: e.family, workflow: e.workflow }]));

export default async function Home() {
  // 1. Await the cookies() function (Required in Next.js 15/16)
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  // 2. Verify the session
  if (!verifySession(token, sessionSecret())) {
    redirect("/login"); // This will send them back to login if invalid
  }

  // 3. Only render the workspace if auth passes
  return <Workspace initialJobs={listJobs(getDb())} catalogLabels={CATALOG_LABELS} />;
}
