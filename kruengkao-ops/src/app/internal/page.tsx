import { InternalWorkspace } from "@/components/internal/internal-workspace";
import { getInternalWorkspace } from "@/lib/queries";

export default async function InternalPage() {
  const { projects, tasks, dependencies } = await getInternalWorkspace();
  return (
    <InternalWorkspace
      initialProjects={projects}
      initialTasks={tasks}
      initialDependencies={dependencies}
    />
  );
}
