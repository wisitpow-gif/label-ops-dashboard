import { LibraryMap } from "@/components/library/library-map";
import {
  getCurrentUserEmail,
  getOfficialAssets,
  getProjects,
} from "@/lib/queries";

export default async function LibraryPage() {
  const [projects, officialAssets, userEmail] = await Promise.all([
    getProjects(),
    getOfficialAssets(),
    getCurrentUserEmail(),
  ]);

  return (
    <LibraryMap
      projects={projects}
      officialAssets={officialAssets}
      userEmail={userEmail}
    />
  );
}
