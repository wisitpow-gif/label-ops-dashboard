import { InternalWorkspace } from "@/components/internal/internal-workspace";
import { getCurrentUserEmail, getInternalWorkspace } from "@/lib/queries";

export default async function InternalPage() {
  const [{ projects, tasks, dependencies }, userEmail] = await Promise.all([
    getInternalWorkspace(),
    getCurrentUserEmail(),
  ]);
  return (
    <InternalWorkspace
      initialProjects={projects}
      initialTasks={tasks}
      initialDependencies={dependencies}
      userEmail={userEmail}
    />
  );
}
