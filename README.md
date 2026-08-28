# Astro Ruddy_Shelduck

Astro Ruddy_Shelduck is a quiet, hand-drawn starter for a personal blog, research notes, and slowly collected ideas. Its header pairs a ruddy shelduck with layered green water ripples: all ripples are visible at rest, then redraw from the inside out on hover or keyboard focus.

It is built with Astro, Markdown/MDX content collections, Tailwind CSS, local search, RSS, responsive layouts, light and dark modes, and automatically generated social images.

## Make it yours

1. Edit [`src/site.config.ts`](./src/site.config.ts): set your title, name, description, domain, and language.
2. Replace the sample posts and notes in [`content/`](./content/) with your own writing. They are examples only; remove them when you no longer need their reference structures.
3. Add your social links in [`src/components/SocialList.astro`](./src/components/SocialList.astro).
4. Replace [`public/favicon.png`](./public/favicon.png) and [`public/social-card.png`](./public/social-card.png) if you want a different visual identity.
5. Keep the header artwork in [`public/images/`](./public/images/) or replace it together with the layout in [`src/components/layout/Header.astro`](./src/components/layout/Header.astro).

## Writing with AI

AI can draft a post in Markdown; the template still provides the publishing layer:

- Markdown and MDX turn your draft into a readable article.
- Frontmatter supplies the title, description, date, tags, cover, draft state, and social-image metadata.
- Drafts let you review an AI draft before publishing.
- Search, RSS, social previews, and responsive reading pages remain useful after the text is generated.

For a new article, create a `.md` or `.mdx` file in `content/posts/`. For shorter entries, use `content/notes/`.

## Local use

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm check
```

## License and attribution

Astro Ruddy_Shelduck is a derivative of [Astro Cactus](https://github.com/chrismwilliams/astro-theme-cactus) by Chris Williams.

Both the original work and this derivative are released under the MIT License. The original copyright and permission notice are retained in [LICENSE](./LICENSE), as required by MIT. See [NOTICE.md](./NOTICE.md) for the concise attribution record.
