// The works that have a model, and so the only ones on the map: three per architect to
// begin with. 'code' models are built in src/models/buildings/<id>.ts; 'glb' ones are the
// vetted Sketchfab models (scripts/models.mjs), kept where they're richer than code can be.
export const CATALOGUE: Record<string, 'code' | 'glb'> = {
  // Gaudí
  Q48435: 'glb', // Sagrada Família
  Q461371: 'glb', // Casa Batlló
  Q207870: 'glb', // Casa Milà
  // Wright
  Q463179: 'code', // Fallingwater
  Q201469: 'code', // Guggenheim, New York
  Q929965: 'glb', // Robie House
  // Le Corbusier
  Q940746: 'code', // Villa Savoye
  Q2587975: 'code', // Unité d'Habitation, Marseille
  Q638250: 'glb', // Notre Dame du Haut, Ronchamp
  // Mies
  Q807915: 'code', // Barcelona Pavilion
  Q1397013: 'code', // Farnsworth House
  Q753180: 'code', // S. R. Crown Hall
  // Aalto
  Q368706: 'code', // Paimio Sanatorium
  Q2456080: 'code', // Säynätsalo Town Hall
  Q1142522: 'code', // Finlandia Hall
  // Kahn
  Q1741629: 'code', // Kimbell Art Museum
  Q4176334: 'code', // Phillips Exeter Academy Library
  Q128635401: 'code', // Salk Institute
  // Niemeyer
  Q4155889: 'code', // National Congress
  Q201720: 'code', // Cathedral of Brasília
  Q1573239: 'code', // Niterói Contemporary Art Museum
  // Gehry
  Q474326: 'glb', // Walt Disney Concert Hall
  Q179199: 'code', // Guggenheim Bilbao
  Q244816: 'code', // Dancing House
  // Foster
  Q191161: 'code', // 30 St Mary Axe
  Q151897: 'glb', // Reichstag dome
  Q22041180: 'code', // Apple Park
  // Ando
  Q4503738: 'code', // Row House in Sumiyoshi
  Q1655766: 'code', // Church of the Light
  Q11548172: 'code', // Chapel on the Water
  // Hadid
  Q43928: 'glb', // Heydar Aliyev Center
  Q1881229: 'code', // MAXXI
  Q308874: 'code', // London Aquatics Centre
};

const builders = import.meta.glob<{ default: import('./kit').ModelInfo }>('./buildings/*.ts');

/** The code models that exist so far (the catalogue fills in as they're made). */
export const hasCode = (id: string) => `./buildings/${id}.ts` in builders;

export async function buildModel(id: string) {
  const load = builders[`./buildings/${id}.ts`];
  if (!load) throw new Error(`No model for ${id}`);
  const { Kit } = await import('./kit');
  const info = (await load()).default;
  const kit = new Kit();
  info.build(kit);
  return kit.build();
}
