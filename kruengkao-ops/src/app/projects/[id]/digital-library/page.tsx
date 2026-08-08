import { notFound } from "next/navigation";

import { DigitalLibrary } from "@/components/digital-library/digital-library";
import {
  getCurrentUserEmail,
  getProjectAssets,
  getProjectById,
} from "@/lib/queries";

export default async function DigitalLibraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, assets, userEmail] = await Promise.all([
    getProjectById(id),
    getProjectAssets(id),
    getCurrentUserEmail(),
  ]);

  if (!project) notFound();

  return (
    <DigitalLibrary
      project={project}
      initialAssets={assets}
      userEmail={userEmail}
    />
  );
}
