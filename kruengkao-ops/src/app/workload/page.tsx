import { WorkloadBoard } from "@/components/workload/workload-board";
import { getWorkloadData } from "@/lib/queries";

export default async function WorkloadPage() {
  const { projects, tasks, dependencies } = await getWorkloadData();
  return (
    <WorkloadBoard
      initialProjects={projects}
      initialTasks={tasks}
      initialDependencies={dependencies}
    />
  );
}
