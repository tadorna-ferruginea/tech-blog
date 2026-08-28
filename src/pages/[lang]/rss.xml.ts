import rss from "@astrojs/rss";
import type { GetStaticPaths } from "astro";
import { getFeedDetails, getLocalizedPosts, localizedSlug } from "@/data/rss";
import { locales, type Locale } from "@/i18n";

export const getStaticPaths = (() => locales.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET = async ({ params }: { params: { lang: Locale } }) => {
	const locale = params.lang;
	const posts = await getLocalizedPosts(locale);
	const feed = getFeedDetails(locale, "posts");

	return rss({
		title: feed.title,
		description: feed.description,
		site: import.meta.env.SITE,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/${locale}/posts/${localizedSlug(locale, post.id)}/`,
		})),
	});
};
