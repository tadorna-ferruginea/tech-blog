import rss from "@astrojs/rss";
import type { GetStaticPaths } from "astro";
import { getFeedDetails, getLocalizedNotes, localizedSlug } from "@/data/rss";
import { locales, type Locale } from "@/i18n";

export const getStaticPaths = (() => locales.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET = async ({ params }: { params: { lang: Locale } }) => {
	const locale = params.lang;
	const notes = await getLocalizedNotes(locale);
	const feed = getFeedDetails(locale, "notes");

	return rss({
		title: feed.title,
		description: feed.description,
		site: import.meta.env.SITE,
		items: notes.map((note) => ({
			title: note.data.title,
			description: note.data.description,
			pubDate: note.data.publishDate,
			link: `/${locale}/notes/${localizedSlug(locale, note.id)}/`,
		})),
	});
};
