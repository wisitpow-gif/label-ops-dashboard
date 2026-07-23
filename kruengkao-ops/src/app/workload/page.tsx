import { WorkloadBoard } from "@/components/workload/workload-board";
import { getCurrentUserEmail, getWorkloadData } from "@/lib/queries";

export default async function WorkloadPage() {
  const [{ projects, tasks, dependencies }, userEmail] = await Promise.all([
    getWorkloadData(),
    getCurrentUserEmail(),
  ]);
  return (
    <WorkloadBoard
      initialProjects={projects}
      initialTasks={tasks}
      initialDependencies={dependencies}
      userEmail={userEmail}
    />
  );
}
