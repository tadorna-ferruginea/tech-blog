import { type CollectionEntry, getCollection } from "astro:content";

/** Return only published backyard entries in production builds. */
export async function getAllBackyardContent(): Promise<CollectionEntry<"backyard">[]> {
	return await getCollection("backyard", ({ data }) => (import.meta.env.PROD ? !data.draft : true));
}
