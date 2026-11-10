# Splatdex

A public portfolio demo for Gaussian splats. Browse catalogs, save objects, arrange a personal collection, and attach notes to views. The example collection includes Aris Antoniadis's two rocks and Tasmanian shell alongside credited shared captures.

## Hosting and visitor storage

The demo at `https://arisaanto.github.io/splatdex/` is a static GitHub Pages site. It requires no running Mac, local server, private account, or active Codex chat. The portfolio's globe link points to `/splatdex/` on the same hosted website.

Collection edits and notes live in the visitor's browser. They do not alter the published examples or another visitor's collection. Clearing browser data can remove those edits. Models load on demand, and the viewer releases a model when switching objects. The optional language model runs on the visitor's device after a separate download, using the revision pinned in `guide-worker.js`.

The public demo has no camera, upload bridge, reconstruction API, or access to the private capture service. Visitors cannot queue work on the project owner's Mac. The iPhone capture and Mac reconstruction workflow is separate and is demonstrated on the project page.

## Maintenance

Run `node scripts/check-splatdex.mjs` from the portfolio root before publishing. It checks model and thumbnail files, relative imports, HTML targets, portfolio assets, and separation from the private capture service. No build step or package installation is needed for this public site.

The public viewer is maintained in this directory. Do not replace it wholesale with the private application's `public/` directory, which also contains capture code and private-service integration. Retain models, fonts, and runtime license files when updating assets. Model credits and source links are also available in each object's About panel.
