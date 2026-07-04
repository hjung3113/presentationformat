# RUNTIME SPEC — Container & interaction layer

> The host container and JavaScript every document runs inside. A document built only from a style's `design.md` (visual values) and `authoring-guide.md` (voice) **will not render or behave correctly** without the scaffold and scripts on this page.
>
> **This doc owns:** the `.dc.html` document shell, the `<x-dc>` / `<helmet>` elements, the `data-dc-script` / `DCLogic` lifecycle, the two runtime scripts (scroll-progress + active-nav), the DOM naming contract (`id="sN"` ↔ `data-navlink`), and serving requirements.
> **This doc does NOT cover:** visual values (→ the active style's `design.md`), voice/content (→ the active style's authoring guide). For a ready-to-fill skeleton, copy the active style's `template.dc.html`.
>
> **Style-agnostic:** this file is shared by every style and contains **no hardcoded colors**. The runtime touches exactly six *chrome tokens* (§0.1); the snippets below reference them by name (`⟨accent⟩`, …). When you build, paste the concrete HEX for each from your active style's `design.md`. The one place those values physically live is the style's `template.dc.html`.

---

## 0. Why this layer exists

The reference documents are not plain HTML. They are **`.dc.html` component documents** hosted by `support.js` — a generated React-based runtime. The runtime:

- finds the `<x-dc>` element, hides the raw markup, and re-renders the template into a root node;
- hoists `<helmet>` children (`<link>`, `<style>`, `<meta>`) into `<head>`;
- executes **only** a trailing `<script type="text/x-dc" data-dc-script>` that defines `class Component extends DCLogic`. A normal `<script>` inside the body does **not** run as page JS.

Consequences a spec-only author would not predict:
- A plain `<html><body>` with the visual tokens pasted in renders **blank** (no `<x-dc>`) or unstyled.
- Progress bar and active-nav written in a vanilla `<script>` **never fire** — they must live in `componentDidMount`.
- The file must be **served over http(s)** and named `*.dc.html`; `support.js` must sit beside it.

---

## 0.1 Chrome tokens (the only style-scoped values the runtime touches)

The shell and the two runtime scripts color exactly six slots. This file names them; the active style's `design.md` supplies the HEX. Substitute when you copy the snippets below.

| Token | Slot | Value = this token in the active style's `design.md` |
|-------|------|------------------------------------------------------|
| `⟨bg-canvas⟩` | page + wrapper background | Page background (`design.md §0`) |
| `⟨ink⟩` | default body text | `ink-800` |
| `⟨selection⟩` | text selection highlight | `on-accent` (selection variant) |
| `⟨accent⟩` | scroll-progress bar, active nav link | `accent` |
| `⟨nav-idle⟩` | inactive nav link | `muted-500` |
| `⟨nav-ref⟩` | de-emphasized reference/appendix link | `muted-300` |

> `support.js` is a generated third-party runtime and carries its own internal HEX; it is **not** style-scoped and is exempt from the "no hardcoded colors in shared runtime" rule.

---

## 1. Document shell (required — copy, substituting the §0.1 chrome tokens)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
  <helmet>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      html { scroll-behavior: smooth; }
      body { margin:0; background:⟨bg-canvas⟩; word-break: keep-all; overflow-wrap: break-word; text-wrap: pretty; }
      p, h1, h2, h3, div, span, li, a { word-break: keep-all; }
      *::selection { background:⟨selection⟩; }
      .nav-scroll::-webkit-scrollbar { height:0; }
    </style>
  </helmet>

  <div style="font-family:Pretendard,sans-serif; color:⟨ink⟩; background:⟨bg-canvas⟩; min-height:100vh;">
    <!-- progress bar, sticky nav, hero, paper sheet, sections … (see the active style's template.dc.html) -->
  </div>
</x-dc>

<script type="text/x-dc" data-dc-script>
class Component extends DCLogic {
  componentDidMount() { /* §3 runtime scripts go here */ }
  componentWillUnmount() { if (this._cleanup) this._cleanup(); }
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

Rules:
- **`<helmet>` is a real element, not a comment.** All `<link>` / `<style>` / `<meta>` go inside it as the first child of `<x-dc>`; the runtime hoists them to `<head>`. Anything outside `<helmet>` renders inline.
- **Font link order matters:** Pretendard CSS → two `preconnect` hints → Google Fonts sheet. The two `preconnect` links are required (the reference includes them) — omitting them slows font fetch and changes FOUT timing vs the reference.
- `renderVals() { return {}; }` is required boilerplate even when empty.

---

## 2. DOM naming contract (load-bearing — the JS keys off these)

| Element | Required attribute | Example |
|---------|-------------------|---------|
| Hero container | `id="top"` | `<div id="top" …>` |
| Nav brand link | `href="#top"` | scrolls to hero |
| Each section | `id="sN"` (`s1…s8`), appendix `id="sref"` | `<section id="s3" …>` |
| Each section | `data-screen-label="NN <Korean title>"` | `data-screen-label="03 개선 방향"` (human-readable label used by host tooling; mirror the eyebrow number) |
| Each nav link | `data-navlink="sN"` **and** `href="#sN"` | `<a data-navlink="s3" href="#s3">` |
| Progress bar inner div | `id="rprog"` | `<div id="rprog" style="width:0%">` |
| Nav link row | `class="nav-scroll"` + `overflow-x:auto` | scrollbar hidden via global CSS |

**`data-navlink="sN"`, the section `id="sN"`, and the `href="#sN"` must all agree.** Rename a section id → update its nav link's `data-navlink` and `href` together, or the active-nav observer goes inert.

---

## 3. Runtime scripts (copy verbatim into `componentDidMount`)

Page-level interaction JS lives in `componentDidMount`; teardown handles go on `this._cleanup` and are released in `componentWillUnmount`.

### 3.1 Scroll-progress bar
Markup (fixed, above the nav — `z-index:60` vs nav `z-index:50`):
```html
<div style="position:fixed; top:0; left:0; right:0; height:3px; background:transparent; z-index:60;">
  <div id="rprog" style="height:100%; width:0%; background:⟨accent⟩;"></div>
</div>
```
Script:
```js
const bar = document.getElementById('rprog');
const onScroll = () => {
  const h = document.documentElement;
  const sc = h.scrollTop || document.body.scrollTop || 0;
  const max = (h.scrollHeight - h.clientHeight) || 1;
  if (bar) bar.style.width = Math.min(100, Math.max(0, sc / max * 100)) + '%';
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
```

### 3.2 Active-nav (IntersectionObserver)
```js
const links = Array.from(document.querySelectorAll('[data-navlink]'));
const byId = {};
links.forEach(l => { byId[l.getAttribute('data-navlink')] = l; });
const secs = Object.keys(byId).map(id => document.getElementById(id)).filter(Boolean);
const setActive = (id) => {
  links.forEach(l => {
    const on = l.getAttribute('data-navlink') === id;
    l.style.color = on ? '⟨accent⟩' : '⟨nav-idle⟩';
    l.style.fontWeight = on ? '700' : '500';
  });
};
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
secs.forEach(s => io.observe(s));

this._cleanup = () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
```
- `rootMargin: '-45% 0px -50% 0px'` makes "active" mean "section is in the middle band of the viewport." Do not change it — a default rootMargin highlights at the wrong scroll position.
- Active styling is applied **imperatively** (`l.style.color`/`fontWeight`), overriding each link's inline `⟨nav-idle⟩` / weight 500.
- The de-emphasized reference link (`⟨nav-ref⟩`) is also driven by this loop — when inactive it returns to `⟨nav-idle⟩`; if you want it to stay muted, exclude it from the observed set.

---

## 4. Serving & runtime requirements

- Serve over **http(s)**, not `file://`. `support.js` does `fetch(location.href)` to re-parse the live template and `fetch('./<Name>.dc.html')` for sibling components; `file://` breaks these.
- The page needs **outbound network**: React/ReactDOM UMD (unpkg), Pretendard (jsdelivr), Google Fonts. `support.js` injects React itself — do not add your own React tags.
- Filename must end **`.dc.html`**; `support.js` must sit in the same directory.
- **No media queries.** Mobile resilience comes only from intrinsic flex: hero stat tiles `flex:1; min-width:150px` inside a `flex-wrap:wrap` row, and the nav row `overflow-x:auto`. This is a desktop-first reading document (~1100px). See the active style's `design.md` responsive note before adding any breakpoint.
