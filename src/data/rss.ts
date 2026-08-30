import { getCollection } from "astro:content";
import { getAllBackyardContent } from "@/data/backyard";
import { getAllPosts } from "@/data/post";
import type { Locale } from "@/i18n";

const feedDetails = {
	zh: {
		notes: { description: "Nicole 的随记。", title: "赤麻鸭的池塘｜随记" },
		posts: { description: "Nicole 的文章。", title: "赤麻鸭的池塘｜文章" },
	},
	en: {
		notes: { description: "Nicole's notes.", title: "Ruddy Shelduck’s Pond | Notes" },
		posts: { description: "Nicole's blog posts.", title: "Ruddy Shelduck’s Pond | Blog" },
	},
} as const;

export function getFeedDetails(locale: Locale, type: "posts" | "notes") {
	return feedDetails[locale][type];
}

export async function getLocalizedPosts(locale: Locale) {
	const posts = await getAllPosts();
	return posts.filter((post) => post.id.startsWith(`${locale}/`));
}

export async function getLocalizedBackyardContent(locale: Locale) {
	const content = await getAllBackyardContent();
	return content.filter((entry) => entry.id.startsWith(`${locale}/`));
}

export async function getLocalizedNotes(locale: Locale) {
	const notes = await getCollection("note");
	return notes.filter((note) => note.id.startsWith(`${locale}/`));
}

export function localizedSlug(locale: Locale, id: string) {
	return id.slice(`${locale}/`.length);
}
