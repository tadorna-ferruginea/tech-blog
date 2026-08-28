export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export const labels = {
	zh: {
		about: "关于",
		home: "主页",
		notes: "随记",
		posts: "文章",
		tags: "标签",
	},
	en: {
		about: "About",
		home: "Home",
		notes: "Notes",
		posts: "Blog",
		tags: "Tags",
	},
} as const;

export const siteNames: Record<Locale, string> = {
	zh: "赤麻鸭的池塘",
	en: "Ruddy Shelduck’s Pond",
};

export function getLocale(pathname: string): Locale {
	return pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";
}

export function localizedPath(locale: Locale, pathname: string): string {
	const pathWithoutLocale = pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
	return `/${locale}${pathWithoutLocale}`.replace(/\/$/, "/");
}
