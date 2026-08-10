# arisaanto.github.io

Source for the personal website of Aris Antoniadis, published with GitHub Pages at [arisaanto.github.io](https://arisaanto.github.io/).

The site is intentionally dependency-free: semantic HTML, one stylesheet, and a small theme-preference script. GitHub Pages serves the repository directly; `.nojekyll` disables Jekyll processing.

## Structure

```text
index.html                  Homepage: introduction, projects, writing, news
photos/index.html           Photography collection
writing/_article-template.html
                            Starter for future long-form web articles
assets/css/site.css         Complete visual system
assets/js/theme.js          System-aware, persistent light/dark theme
assets/images/portrait.jpg  Optimized homepage portrait
assets/images/photos/       Ordered photography assets
assets/documents/           CV, project papers, and essay PDFs
```

## Add a project

Copy one `.project` block in `index.html`. A project supports:

- title and short description;
- year and status;
- optional Project, Paper, Demo, Code, or GitHub links;
- an optional `.project-media` figure placed before `.project-content`.

Keep substantial code and reproducible work in its own repository. This repository contains only the presentation layer and the documents/images needed by the website.

## Add writing

Copy one `.writing-item` block in `index.html`. Existing academic essays may continue to link to PDFs. For a long-form web article, copy `writing/_article-template.html` to `writing/<article-slug>/index.html`; the starter includes patterns for prose, citations, figures, captions, charts, method notes, and footnotes.

## Add or reorder photographs

1. Put the optimized image in `assets/images/photos/`.
2. Add a `<figure class="photo">` block to `photos/index.html`.
3. Move that block anywhere in the file to change the displayed order. Filenames do not control order.

Use meaningful filenames for new photographs; the inherited numbered filenames can remain until they are deliberately renamed.

## Local preview

Run any static file server from the repository root, then open `index.html` through that server. No build command is required.
