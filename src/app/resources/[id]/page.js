import { fetchItem, fetchItemCollections } from "@/lib/zotero/client";
import { transformItem, prepareForDetail, prepareForCard } from "@/lib/zotero/transform";
import ResourceDetail from "@/components/Resources/ResourceDetail";

export default async function ResourceDetailPage({ params }) {
  const { id } = await params;

  let resource = null;
  let relatedResources = [];
  let error = null;

  try {
    const rawItem = await fetchItem(id);
    const collections = await fetchItemCollections(id);

    // Get all collection names that this item belongs to
    const collectionNames = collections.map((c) => c.name);
    
    // Get the first collection key (primary collection for the item)
    const firstCollectionKey = collections.length > 0 ? collections[0].key : undefined;

    // Transform with collection info
    const transformedItem = transformItem(rawItem, {
      collectionName: collectionNames.length > 0 ? collectionNames : undefined,
      collectionKey: firstCollectionKey,
    });

    resource = prepareForDetail(transformedItem);

    // Fetch related resources in parallel, silently skip any that fail
    if (resource.relatedIds && resource.relatedIds.length > 0) {
      const relatedRaws = await Promise.all(
        resource.relatedIds.map((key) => fetchItem(key).catch(() => null))
      );
      relatedResources = relatedRaws
        .filter(Boolean)
        .map((raw) => prepareForCard(transformItem(raw)));
    }
  } catch (err) {
    error = err;
  }

  if (error || !resource) {
    return (
      <div
        className="p-12 text-center"
        style={{
          color: "var(--text-secondary)",
        }}
      >
        <h1>Resource not found</h1>
      </div>
    );
  }

  return <ResourceDetail resource={resource} relatedResources={relatedResources} />;
}
