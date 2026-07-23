import { createServiceClient } from "@/lib/supabase/service-client";
import { createCollectionRepository, type CollectionWithCount } from "@/repositories/collection-repository";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import type { CollectionRow, RepositoryRow } from "@/types/database";

/** Server-side data for the admin-managed GitHub Explorer collections. */
export async function getAdminCollections(): Promise<CollectionWithCount[]> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return [];
    return await createCollectionRepository(supabase).listAllWithCounts();
  } catch (error) {
    console.error("[admin-collection-service] getAdminCollections failed:", error);
    return [];
  }
}

/** The edit drawer needs hidden/archived repositories too, so it uses the service client. */
export async function getAdminCollectionEditorData(collectionId?: string): Promise<{ collection: CollectionRow | null; repositories: RepositoryRow[]; memberIds: string[] }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return { collection: null, repositories: [], memberIds: [] };
    const collections = createCollectionRepository(supabase);
    const collection = collectionId ? await collections.getById(collectionId) : null;
    const [repositories, members] = await Promise.all([
      createRepositoryRepository(supabase).list(),
      collection ? collections.listRepositoriesForCollection(collection.id) : Promise.resolve([]),
    ]);
    const memberIds = members.map((row) => row.id);
    return { collection, repositories, memberIds };
  } catch (error) {
    console.error("[admin-collection-service] getAdminCollectionEditorData failed:", error);
    return { collection: null, repositories: [], memberIds: [] };
  }
}
