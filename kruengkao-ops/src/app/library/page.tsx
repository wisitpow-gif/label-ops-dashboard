import { LibraryMap } from "@/components/library/library-map";
import { getProjects, getVaultedAssets } from "@/lib/queries";

export default async function LibraryPage() {
  const [projects, vaultedAssets] = await Promise.all([
    getProjects(),
    getVaultedAssets(),
  ]);

  return <LibraryMap projects={projects} vaultedAssets={vaultedAssets} />;
}
