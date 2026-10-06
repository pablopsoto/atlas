# Atlas

A minimal monochrome atlas of the works of ten of the world's most celebrated architects, from Gaudí to Hadid. Filter by era, style or architect, follow the line that connects one architect's buildings, and step into any work in 3D.

**Live:** https://atlas.pablopsoto.workers.dev

## How it's made

- Data from Wikidata and Wikimedia Commons, curated per architect by Wikipedia coverage (`npm run data`).
- The focus view shows a building three ways, best first: a hand-vetted Creative Commons Sketchfab model rendered as clay, Google's photorealistic 3D tiles through Cesium ion's free plan, or OpenStreetMap massing.
- MapLibre for the map; three.js and 3d-tiles-renderer for the 3D view; served from a Cloudflare Worker with static assets.

## Run it

```sh
npm install
cp .env.example .env.local   # add your Cesium ion token (and SKETCHFAB_TOKEN to rebuild models)
npm run dev
npm run data      # rebuild the dataset from Wikidata
npm run models    # rebuild the clay models from Sketchfab (needs SKETCHFAB_TOKEN)
npm run deploy
```

---

Designed and built by Pablo Pérez — [@pablopsoto](https://www.instagram.com/pablopsoto/)
