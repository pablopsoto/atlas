// Hand-vetted 3D models from Sketchfab (downloadable, CC licences allowing reuse with credit).
// Shown as uniform clay models in the focus view.
//   rotate: [x, y, z] degrees, for models authored on their side.
//   maxNodeSize: drop parts larger than this (model units) — baked-in terrain or sky.
//   crop: keep geometry within this fraction of the model's plan size around the building.
//   maxEdge: with crop, also drop triangles with an edge longer than this fraction of the crop radius.
export const MODELS = {
  Q48435: { uid: '1e6a870501584df28a328d1278b96b97', title: "Sagrada Familia", author: "wareFLO", license: 'CC Attribution' }, // Sagrada Família
  Q461371: { uid: '0ca96e6b5cff4bbf98ef54071f0c4783', title: "Casa Batllo", author: "Roberto Dom\u00ednguez", license: 'CC Attribution' }, // Casa Batlló
  Q207870: { uid: '04c61b3d1dc2448dbaa34d9f30684c87', title: "La Pedrera - Casa Mil\u00e0", author: "Blayne Jackson", license: 'CC Attribution' }, // Casa Milà
  Q1680814: { uid: '27007865693c4a778204f53f52dc9972', title: "Unity Temple ( frank lloyd wright )", author: "Sam_Kasrawi", license: 'CC Attribution' }, // Unity Temple
  Q929965: { uid: '95a8ebc62f314145a37ab814bbe42c38', title: "Robie house", author: "TheMegabyte", license: 'CC Attribution' }, // Robie House
  Q807915: { uid: '8c84589050f94176b03140693388cd8e', title: "Barcelona Pavilion (3D Demo)", author: "Bulin_J", license: 'CC Attribution' }, // Barcelona Pavilion
  Q940746: { uid: '2f86401294d14de09acd96611b0f8e99', title: "Villa Savoye - Le Corbusier", author: "Matheus Rudo", license: 'CC Attribution' }, // Villa Savoye
  Q368706: { uid: 'edadc72f28e84eceb7e0df6dc04fee9c', title: "Paimio Sanatorium", author: "Lassi Kaukonen", license: 'CC Attribution' }, // Paimio Sanatorium
  Q463179: { uid: '6f2f6823edb74ca9badcc1580aa80743', title: "Fallingwater House - Frank Lloyd Wright", author: "Matheus Rudo", license: 'CC Attribution', maxNodeSize: 20000, crop: 0.16, maxEdge: 0.35 }, // Fallingwater
  Q1397013: { uid: '6a26424e8a524957b0fe55db0c0d357c', title: "Farnworth House", author: "nafiseh", license: 'CC Attribution' }, // Farnsworth House
  Q638250: { uid: '6656a2458d304c05998d6e10d62e0db2', title: "996_FT_20180317 Notre Dame du Haut", author: "impasse", license: 'CC Attribution', crop: 0.2 }, // Notre Dame du Haut, Ronchamp
  Q753180: { uid: '1c9a67d41fab4c14abec889efbd266cb', title: "S. R. Crown Hall - Mies van der Rohe", author: "Matheus Rudo", license: 'CC Attribution', crop: 0.045 }, // S. R. Crown Hall
  Q201469: { uid: '11551548e9784079bd6e2f4d6eecbe96', title: "Guggenheim NYC", author: "vSpline", license: 'CC Attribution' }, // Solomon R. Guggenheim Museum
  Q4155889: { uid: 'f6ec1c45d82142eda5d1dea95a5a759d', title: "Congresso Nacional", author: "arielguerreiro", license: 'CC Attribution' }, // National Congress Palace
  Q201720: { uid: '9f2d2de9642f48ac873b5aab62b667f7', title: "Cathedral Of Bras\u00edlia", author: "cuankiproduction", license: 'CC Attribution', crop: 0.16 }, // Cathedral of Brasília
  Q1741629: { uid: '3a3dc7e2c9fb48a68d7553e6d4de3e2a', title: "Kimbell Art Museum", author: "colife3", license: 'CC Attribution' }, // Kimbell Art Museum
  Q4176334: { uid: '694640d04b2e40238591f2355a003d89', title: "Louis Kahn - Exeter Library", author: "enteRenders", license: 'CC Attribution' }, // Phillips Exeter Academy Library
  Q4503738: { uid: '88ecdba1e48d408da77165ba9dd409a4', title: "Tadao Ando - Azuma House", author: "dchant design", license: 'CC Attribution' }, // Row House in Sumiyoshi
  Q1573239: { uid: '3bad2154dad14fff9fa0ea32c76de13a', title: "MAC - Contemporary Art Museum by Oscar Niemeyer", author: "Breno_dAquino", license: 'CC Attribution' }, // Niterói Contemporary Art Museum
  Q151897: { uid: 'e5da471dc8cd4eae95877d9ef77a9ed8', title: "Reichstag Fbx", author: "lutzibutz", license: 'CC Attribution' }, // Reichstag dome
  Q474326: { uid: '65cfd28f2904457e9b5c4e8cd1c37fc0', title: "Disney Concert Hall 3D Model", author: "Russell.Zazueta.Rivera", license: 'CC Attribution' }, // Walt Disney Concert Hall
  Q99236: { uid: 'f7bbb3fa445f43d880668c1651290c92', title: "Millau Viaduct", author: "Robert Kiraly", license: 'CC Attribution' }, // Millau Viaduct
  Q191161: { uid: 'daf1b68a8e6c439a99ea3adaf0979807', title: "30 St. Mary Axe (The Gherkin)", author: "Yuma The Builder", license: 'CC Attribution' }, // 30 St Mary Axe
  Q43928: { uid: 'db497edeba374d818a833285a593ce29', title: "1219", author: "sarhern", license: 'CC Attribution' }, // Heydar Aliyev Center
  Q22041180: { uid: '596bafedaef9402888fd569b42174e18', title: "Apple Mothership - Cupertino", author: "luminou_CS", license: 'CC Attribution' }, // Apple Park
};
