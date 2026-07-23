import { LibraryMap } from "@/components/library/library-map";
import {
  getCurrentUserEmail,
  getProjects,
  getVaultedAssets,
} from "@/lib/queries";

export default async function LibraryPage() {
  const [projects, vaultedAssets, userEmail] = await Promise.all([
    getProjects(),
    getVaultedAssets(),
    getCurrentUserEmail(),
  ]);

  return (
    <LibraryMap
      projects={projects}
      vaultedAssets={vaultedAssets}
      userEmail={userEmail}
    />
  );
}
