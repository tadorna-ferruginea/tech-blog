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
  backyard/
    zh/                 # Private Chinese service metadata
    en/                 # Private English service metadata
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
- Treat the Chinese and English Home and About pages as independently authored versions, not as
  automatic translations: preserve their distinct tone, content, and jokes (including the darker
  Chinese About). Do not translate, synchronize, or overwrite either version unless Nicole
  explicitly asks. Only when Nicole supplies one language version and asks for its counterpart
  should an AI translation be created and disclosed.
- Keep translated frontmatter and publish dates aligned. The language switcher must link each
  page to its exact counterpart, never to a generic home page.
- A Post or Note's paired filename and resulting URL slug must be a concise, meaningful AI
  summary of its title, not a generic placeholder, implementation label, or date. When a title is
  changed, regenerate the shared Chinese/English slug from the revised title and update every
  internal link that uses it. Treat this as a URL change: preserve or add a redirect when the
  entry may already have been published.
- Backyard entries follow the same paired-language, aligned-date, meaningful-slug, and exact
  language-switching rules as Posts and Notes. They live under `content/backyard/<lang>/` and use
  the same relative slug in both languages. They are service metadata rather than prose Posts:
  do not add a translation disclosure unless the entry contains a translated author-written body.
- Keep every Backyard entry safe to publish in the static site source: no passwords, access tokens,
  private names, individual availability, raw schedule records, or other protected data in its
  frontmatter or body. Store only public labels, descriptions, dates, pinning status, and widget
  configuration there; protected data belongs behind the Worker.
- A Backyard item has one canonical content entry. `pinned: true` is a filtered reference to that
  same entry, so it appears in both Pinned Content and Content without duplicated metadata.
- Backyard routes remain unlinked from public navigation, RSS, sitemap, and site search, and must
  emit `noindex, nofollow`. These measures reduce accidental discovery only; all protected data and
  mutations must be authorized by the Worker on every request.
- Every bilingual post or Note must have one author-written original (Chinese or English); only
  its counterpart may be an AI translation. Put its disclosure immediately after the translated
  file's frontmatter inside a `<details class="translation-notes">` block. Use the summary
  `Translation note` for English posts (and an equivalent concise Chinese label for Chinese
  posts), name the exact model and source language, and include:
  `本文由 AI 模型 <模型名称> 从英文原文翻译；英文原文由 Nicole 手写，以英文原文为准。`
  for a Chinese translation, or
  `This post was translated from Nicole's original Chinese by <model name>; the Chinese
  original prevails.` for an English post translation, or replace `post` with `note` for an
  English Note translation.
- Treat a translation disclosure as a one-way synchronization marker. When Nicole edits the
  version without a translation disclosure (the original), update its declared translated
  counterpart to match while retaining its disclosure. When Nicole edits the version with a
  translation disclosure, never propagate those edits back into the original.
- When translating a cited text, use an attributable human translation whenever one is available.
  Put the translator and source at the end of the post inside a separate
  `<details class="quotation-notes">` block. Quote only the span actually cited in Nicole's
  original: never include adjacent source text merely because it occurs in the same paragraph.
  Prefer public-domain or openly licensed translations; otherwise link to the source rather than
  reproducing lengthy copyrighted text.
- If quotations use more than one source, mark each quotation with sequential bracketed references
  such as `[1]` and `[2]`, then list the matching translator and source for each number separately
  inside the `quotation-notes` block.
- Keep complete licensing information on the dedicated `/zh/license/` and `/en/license/` pages
  (with `/license/` retained as a general entry point). Keep the bilingual About page limited to
  Nicole's personal introduction; do not repeat licensing information there, in the site footer,
  or at the end of individual Posts or Notes. The repository root `LICENSE` remains the MIT
  license for code and must retain both copyright lines. Keep quotation notes focused on
  attribution and sources; add a separate exception only when a source has a material restriction
  that readers need to know.
- If a Post includes Nicole's own code, add a short MIT line at its end: `文中代码采用 MIT 许可。` /
  `Code in this post is licensed under the MIT License.` This includes interactive JavaScript
  programs and their HTML/CSS, not just fenced code snippets. Third-party libraries, code, and
  assets remain subject to their original licenses.
- `archive/examples/` is intentionally outside the published content directories. Do not import
  it into content collections or edit it unless maintaining historical reference material.
- When adding a new route or UI label, provide both Chinese and English text.
- Note images are capped in the full Note view. In home and Notes-list previews, use one Note body
  image as a 4:3, `object-fit: cover` thumbnail; do not render full body images in the preview.
  Every Note preview card must use the full available list width. Its height follows the fixed 4:3
  thumbnail dimensions (7.5rem on small screens and 9rem from `sm` upward), rather than its text
  length. Clamp preview titles to one line and body text to one line on small screens or two lines
  from `sm` upward; overflowing text must end with an ellipsis and the full Note remains available
  through its link. For English previews, treat each word as an indivisible unit so an ellipsis
  never cuts a word in half. Derive card height from the responsive thumbnail height plus the
  vertical padding, so a thumbnail-width change automatically changes the card height as well.
  The first body image is the default thumbnail. For a multi-image Note, select one explicitly in
  frontmatter with `thumbnail: { src: /images/example.webp, alt: "..." }`; it must reference an
  image already used in that Note's body rather than a separate thumbnail asset.

## Shared activity schedules

For small-group, shared-time tools such as pickup football or other activity schedulers, preserve
the site's existing page shell, header, typography, and spacing. The interactive schedule is
content inside a Post or Backyard content page, not a reason to redesign the surrounding site page.

- Design mobile-first. The complete agreed time window, including all days and hourly rows, must
  fit on a 375 CSS-pixel-wide phone without horizontal scrolling. Desktop may add room but must
  not become the layout baseline.
- On desktop, constrain the schedule to a deliberate maximum width and align its left edge with
  the Post content. Do not centre a narrow table or let it grow indefinitely.
- Make the table compact by reducing blank space, cell padding, and row height — not by
  proportionally shrinking essential text or symbols until they are hard to read.
- Use fixed four-corner cells: temperature at upper-left, the weather symbol at upper-right,
  ball availability at lower-left, and the aggregate attendee count at lower-right. Do not reserve
  an empty centre area. Keep personal names and individual availability out of the public table.
- Put time labels on the boundaries between rows rather than consuming a dedicated left column;
  include the final end-time label so the displayed range is closed.
- Treat the weather provider as authoritative. Preserve its specific reported condition and map
  it one-to-one to an appropriate line icon and conventional, restrained background colour; do
  not collapse conditions or infer a sporting recommendation. Use warm pale yellow for clear
  conditions, cool greys for cloud/fog, blue for rain, ice blue for snow, pale violet for freezing
  rain, and muted blue-violet for thunderstorms. Keep richer weather data in the service layer
  unless it is needed as an exceptional warning.
- The visible legend must use one consistent syntax and cover all four cell fields: weather,
  people, ball availability, and temperature.

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
