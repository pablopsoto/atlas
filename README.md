# Atlas

A minimal monochrome atlas of the works of ten of the world's most celebrated architects, from Gaudí to Hadid. Filter by era, style or architect, follow the line that connects one architect's buildings, and step into any work in 3D.

**Live:** https://atlas.pablopsoto.workers.dev

## How it's made

- Data from Wikidata and Wikimedia Commons, curated per architect by Wikipedia coverage (`npm run data`).
- Most models are built in code from real dimensions, with a small modelling kit (`src/models/kit.ts`, one file per building in `src/models/buildings/`). Works whose carved forms code can't match (the Sagrada Família, Casa Batlló, the Robie House, Disney Hall, the Reichstag and the Heydar Aliyev Center) use vetted Creative Commons Sketchfab models, simplified to geometry (`npm run models`).
- `src/models/catalogue.ts` lists the works with a model; only those are on the map. `dev/models.html?id=<Wikidata id>` shows one model on its own in the clay viewer.
- MapLibre for the map, three.js for the models; served from a Cloudflare Worker with static assets.

## Run it

```sh
npm install
cp .env.example .env.local   # SKETCHFAB_TOKEN, only to rebuild the downloaded models
npm run dev
npm run data      # rebuild the dataset from Wikidata
npm run models    # rebuild the clay models from Sketchfab (needs SKETCHFAB_TOKEN)
npm run deploy
```

---

Designed and built by Pablo Pérez — [@pablopsoto](https://www.instagram.com/pablopsoto/)
