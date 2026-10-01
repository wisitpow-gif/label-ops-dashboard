import { redirect } from "next/navigation";

// Each dashboard module is now its own route. "/" redirects to Overview, and
// legacy ?tab= deep-links map to their new module route.
const TAB_ROUTES: Record<string, string> = {
  overview: "/overview",
  table: "/releases",
  kanban: "/workload",
  gantt: "/gantt",
  calendar: "/calendar",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect((tab && TAB_ROUTES[tab]) || "/overview");
}
