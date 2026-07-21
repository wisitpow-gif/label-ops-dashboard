import { notFound } from "next/navigation";

import { IngestHub } from "@/components/ingest/ingest-hub";
import { getProjectAssets, getProjectById } from "@/lib/queries";

export default async function IngestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, assets] = await Promise.all([
    getProjectById(id),
    getProjectAssets(id),
  ]);

  if (!project) notFound();

  return <IngestHub project={project} initialAssets={assets} />;
}
