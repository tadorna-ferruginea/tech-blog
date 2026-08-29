# Ruddy Shelduck’s Pond

My bilingual personal blog: a place for glimmering fragments about my life.

Visit [tadorna-ferruginea.com](https://tadorna-ferruginea.com).

## About the site

The site is built with Astro, Markdown/MDX content collections, Tailwind CSS, local search, RSS, responsive layouts, light and dark modes, and generated social images. Its header features a hand-drawn ruddy shelduck and layered green water ripples that redraw from the inside out on hover or keyboard focus.

Chinese and English live at `/zh/` and `/en/`; the root URL chooses one from the browser language. Posts and notes are stored as matching language pairs under [`content/`](./content/). See [`AGENTS.md`](./AGENTS.md) for the publishing, translation-disclosure, quotation, and image-privacy conventions used in this repository.

## Local development

```bash
pnpm install
pnpm dev
```

To make a production build:

```bash
pnpm build
```

## Theme and licensing

The site’s template is called **Astro Croissant**, a derivative of [Astro Cactus](https://github.com/chrismwilliams/astro-theme-cactus) by Chris Williams.

Repository code is released under the MIT License. Site writing and images are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) unless otherwise noted. The original copyright and permission notice are retained in [LICENSE](./LICENSE); [NOTICE.md](./NOTICE.md) records the derivative work and its changes.
