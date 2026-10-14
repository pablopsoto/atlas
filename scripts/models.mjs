// Hand-vetted 3D models from Sketchfab (downloadable, CC licences allowing reuse with credit),
// kept for the works whose carved or sculpted forms are richer than code can model. Everything
// else is modelled in code (src/models/buildings). All are shown as the same clay model.
//   rotate: [x, y, z] degrees, for models authored on their side.
//   maxNodeSize: drop parts larger than this (model units) — baked-in terrain or sky.
//   crop: keep geometry within this fraction of the model's plan size around the building.
//   maxEdge: with crop, also drop triangles with an edge longer than this fraction of the crop radius.
export const MODELS = {
  Q48435: { uid: '1e6a870501584df28a328d1278b96b97', title: "Sagrada Familia", author: "wareFLO", license: 'CC Attribution' }, // Sagrada Família
  Q461371: { uid: '0ca96e6b5cff4bbf98ef54071f0c4783', title: "Casa Batllo", author: "Roberto Dom\u00ednguez", license: 'CC Attribution' }, // Casa Batlló
  Q207870: { uid: '04c61b3d1dc2448dbaa34d9f30684c87', title: "La Pedrera - Casa Mil\u00e0", author: "Blayne Jackson", license: 'CC Attribution' }, // Casa Milà
  Q929965: { uid: '95a8ebc62f314145a37ab814bbe42c38', title: "Robie house", author: "TheMegabyte", license: 'CC Attribution' }, // Robie House
  Q638250: { uid: '6656a2458d304c05998d6e10d62e0db2', title: "996_FT_20180317 Notre Dame du Haut", author: "impasse", license: 'CC Attribution', crop: 0.2 }, // Notre Dame du Haut, Ronchamp
  Q151897: { uid: 'e5da471dc8cd4eae95877d9ef77a9ed8', title: "Reichstag Fbx", author: "lutzibutz", license: 'CC Attribution' }, // Reichstag dome
  Q474326: { uid: '65cfd28f2904457e9b5c4e8cd1c37fc0', title: "Disney Concert Hall 3D Model", author: "Russell.Zazueta.Rivera", license: 'CC Attribution' }, // Walt Disney Concert Hall
  Q43928: { uid: 'db497edeba374d818a833285a593ce29', title: "1219", author: "sarhern", license: 'CC Attribution' }, // Heydar Aliyev Center
};
