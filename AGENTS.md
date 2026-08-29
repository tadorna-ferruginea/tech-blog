## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project structure

```text
content/
  posts/
    zh/                 # Published Chinese posts
    en/                 # Published English counterparts
  notes/
    zh/                 # Published Chinese notes
    en/                 # Published English counterparts
  tags/
    zh/                 # Chinese tag metadata
    en/                 # English tag metadata
archive/
  examples/             # Original Astro Cactus examples; reference only, never published
public/
  favicon.png           # Croissant browser and app icon
  images/               # Ruddy shelduck and separated water-ripple layers
src/
  components/           # Shared visual components
  layouts/              # Shared page shells
  pages/                # Route definitions
  site.config.ts        # Site identity and navigation settings
```

## Content and languages

- Publish only paired Chinese and English content. Every item must have a matching file under
  `content/<type>/zh/` and `content/<type>/en/` with the same relative slug.
- Keep translated frontmatter and publish dates aligned. The language switcher must link each
  page to its exact counterpart, never to a generic home page.
- Every bilingual blog post must have one author-written original (Chinese or English); only
  its counterpart may be an AI translation. Put its disclosure immediately after the translated
  file's frontmatter inside a `<details class="translation-notes">` block. Use the summary
  `Translation note` for English posts (and an equivalent concise Chinese label for Chinese
  posts), name the exact model and source language, and include:
  `本文由 AI 模型 <模型名称> 从英文原文翻译；英文原文由 Nicole 手写，以英文原文为准。`
  for a Chinese translation, or
  `This post was translated from Nicole's original Chinese by <model name>; the Chinese
  original prevails.` for an English translation.
- When translating a cited text, use an attributable human translation whenever one is available.
  Put the translator and source at the end of the post inside a separate
  `<details class="quotation-notes">` block. Quote only the span actually cited in Nicole's
  original: never include adjacent source text merely because it occurs in the same paragraph.
  Prefer public-domain or openly licensed translations; otherwise link to the source rather than
  reproducing lengthy copyrighted text.
- If quotations use more than one source, mark each quotation with sequential bracketed references
  such as `[1]` and `[2]`, then list the matching translator and source for each number separately
  inside the `quotation-notes` block.
- `archive/examples/` is intentionally outside the published content directories. Do not import
  it into content collections or edit it unless maintaining historical reference material.
- When adding a new route or UI label, provide both Chinese and English text.

## Public image privacy

- Before adding any user-supplied image to `public/` or published content, create a separate
  web-safe copy and automatically remove embedded EXIF, XMP, and IPTC metadata, including GPS
  coordinates, capture time, device details, and author/contact fields. Never modify or delete the
  user's original upload.
- Inspect the public copy for visible personal data: faces, licence plates, email addresses,
  telephone numbers, home or work addresses, IDs, QR/barcodes, and readable private screen or
  document content. Report any detected sensitive details before publishing. Do not redact, blur,
  crop, retouch, or otherwise alter the image's visible content without Nicole's explicit consent.
- Preserve only the web-safe copy in the repository. Do not commit original image files containing
  personal metadata or unredacted sensitive information.
