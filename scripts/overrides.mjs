// Hand-curated corrections layered on top of Wikidata.
// icon: a masterwork — drawn larger, labelled, always included.
// radius: metres around the work kept solid in the 3D focus view (default: from the footprint).
// exclude: not a single built work (a city, an institution, an unbuilt project, a duplicate).

// Works whose Wikidata record doesn't credit the architect (or their firm): [work, architect].
export const EXTRA_WORKS = [
  ['Q1372014', 'Q104898'], // HSBC Building, Hong Kong — Foster
  ['Q7400532', 'Q104898'], // Sainsbury Centre — Foster
];

export const OVERRIDES = {
  // Not individual built works
  Q43433: { exclude: true }, // Chandigarh (the city)
  Q590564: { exclude: true }, // Pampulha (district; the Modern Ensemble stays)
  Q49117: { exclude: true }, // University of Pennsylvania
  Q569926: { exclude: true }, // Interbau
  Q704665: { exclude: true }, // Weissenhof Estate
  Q55619850: { exclude: true }, // "The Architectural Work of Le Corbusier" (UNESCO serial site)
  Q1412364: { exclude: true }, // Unité d'habitation (the concept)
  Q7888512: { exclude: true }, // UN Secretariat (duplicate of UN Headquarters)
  Q591086: { exclude: true }, // Serpentine Galleries (the institution)
  Q1967614: { exclude: true }, // National Portrait Gallery
  Q4891660: { exclude: true }, // Hotel Attraction (unbuilt)
  Q1127212: { exclude: true }, // 2 World Trade Center (unbuilt)
  Q618596: { exclude: true }, // Barcelona-Sagrera (unbuilt)
  Q804210: { exclude: true }, // Bayterek (not Foster's design)
  Q969324: { exclude: true }, // Kumamoto Station
  Q1743116: { exclude: true }, // Toledo Museum of Art (the institution)
  Q4891653: { exclude: true }, // Sagrada Família schools (part of the basilica site)
  Q7333197: { exclude: true }, // Sukhna Lake
  Q7385664: { exclude: true }, // Ryūō Station

  // Gaudí
  Q48435: { icon: true, name: 'Sagrada Família' },
  Q461371: { icon: true, year: 1906 }, // Casa Batlló — Wikidata has the original 1877 building
  Q207870: { icon: true }, // Casa Milà
  Q212867: { icon: true, radius: 220 }, // Park Güell
  Q1046405: { year: 1900 }, // Casa Calvet
  Q746333: { year: 1885 }, // Casa Vicens
  Q567753: { year: 1889, name: 'Col·legi de les Teresianes', type: 'education' },
  // Wright
  Q463179: { icon: true }, // Fallingwater
  Q201469: { icon: true }, // Guggenheim New York
  Q929965: { icon: true, year: 1910 }, // Robie House
  Q1680814: { icon: true, year: 1908 }, // Unity Temple
  Q1208310: { icon: true }, // Taliesin West
  Q11511042: { year: 1924 }, // Yodokō Guest House
  Q578184: { year: 1924 }, // Ennis House
  Q1702484: { year: 1939, type: 'commercial' }, // Johnson Wax Headquarters
  Q3069681: { year: 1889 }, // Home and Studio
  Q3217952: { year: 1906, demolished: 1950 }, // Larkin Administration Building
  Q734970: { year: 1911 }, // Taliesin
  Q11680575: { year: 1937 }, // Jacobs House
  Q5056884: { year: 1950 }, // Cedar Rock (Walter House)
  // Le Corbusier
  Q940746: { icon: true }, // Villa Savoye
  Q638250: { icon: true, name: 'Notre Dame du Haut, Ronchamp', year: 1955 },
  Q2587975: { icon: true, year: 1952 }, // Unité d'Habitation, Marseille
  Q3577598: { year: 1961 }, // Kembs-Niffer lock
  Q25931399: { type: 'civic', radius: 600 }, // Chandigarh Capitol Complex
  // Mies
  Q807915: { icon: true, name: 'Barcelona Pavilion', year: 1929 },
  Q1397013: { icon: true }, // Farnsworth House
  Q737484: { icon: true }, // Seagram Building
  Q753180: { icon: true }, // S. R. Crown Hall
  Q457453: { icon: true }, // Villa Tugendhat
  Q273155: { year: 1951, type: 'housing' }, // 860–880 Lake Shore Drive
  Q1239847: { year: 1967 }, // Toronto-Dominion Centre
  Q9360189: { year: 1967 }, // TD Bank Tower
  Q7069911: { year: 1969 }, // La Station
  Q1565911: { year: 1958 }, // Museum of Fine Arts, Houston (Cullinan Hall)
  // Aalto
  Q368706: { icon: true, radius: 120 }, // Paimio Sanatorium
  Q1142522: { icon: true }, // Finlandia Hall
  Q2706241: { icon: true }, // Villa Mairea
  Q300975: { type: 'culture' }, // Aalto Theatre
  Q300972: { type: 'housing' }, // Aalto-Hochhaus
  Q3977023: { year: 1938, radius: 400 }, // Sunila
  // Kahn
  Q497536: { icon: true, name: 'National Assembly of Bangladesh', radius: 180 },
  Q1741629: { icon: true }, // Kimbell Art Museum
  Q128635401: { icon: true, name: 'Salk Institute', radius: 110 },
  Q4176334: { icon: true }, // Phillips Exeter Academy Library
  Q954769: { year: 1965 }, // Richards Medical Research Laboratories
  Q3746061: { year: 1962 }, // First Unitarian Church of Rochester
  // Niemeyer
  Q4155889: { icon: true, radius: 140 }, // National Congress
  Q201720: { icon: true }, // Cathedral of Brasília
  Q1573239: { icon: true }, // Niterói Contemporary Art Museum
  Q85355: { name: 'Palazzo Mondadori', year: 1975 },
  Q496950: { type: 'civic' }, // Palácio do Planalto
  Q1330634: { type: 'education' }, // University of Brasília
  Q1704545: { year: 1960, radius: 260 }, // Praça dos Três Poderes
  Q281521: { year: 1984, type: 'infrastructure', radius: 450 }, // Sambadrome
  // Gehry
  Q179199: { icon: true, radius: 110 }, // Guggenheim Bilbao
  Q474326: { icon: true }, // Walt Disney Concert Hall
  Q244816: { icon: true }, // Dancing House
  Q3075489: { icon: true, radius: 90 }, // Fondation Louis Vuitton (no footprint in the basemap)
  Q3312712: { year: 2004 }, // Stata Center
  Q670250: { year: 2008 }, // Art Gallery of Ontario (Transformation AGO)
  // Foster
  Q191161: { icon: true, name: '30 St Mary Axe' },
  Q151897: { icon: true, name: 'Reichstag dome', year: 1999 },
  Q99236: { icon: true, radius: 1300 }, // Millau Viaduct
  Q1372014: { icon: true, name: 'HSBC Building, Hong Kong', year: 1985, type: 'commercial' },
  Q22041180: { icon: true, type: 'commercial', radius: 280 }, // Apple Park
  Q7400532: { year: 1978, type: 'culture' }, // Sainsbury Centre
  Q859452: { year: 2006 }, // Hearst Tower
  Q2119741: { type: 'culture' }, // Palace of Peace and Reconciliation
  Q325309: { name: 'Metro Bilbao stations', type: 'infrastructure' },
  // Ando
  Q1655766: { icon: true }, // Church of the Light
  Q4556499: { icon: true }, // Chichu Art Museum
  Q4503738: { icon: true, year: 1976 }, // Row House in Sumiyoshi
  Q1414796: { year: 2002 }, // Modern Art Museum of Fort Worth
  // Hadid
  Q43928: { icon: true, name: 'Heydar Aliyev Center', type: 'culture', radius: 160 },
  Q1881229: { icon: true, type: 'culture', radius: 120 }, // MAXXI
  Q308874: { icon: true }, // London Aquatics Centre
  Q3354553: { icon: true, type: 'culture' }, // Guangzhou Opera House
  Q672833: { year: 2002 }, // Bergisel Ski Jump
  Q2367010: { year: 2008 }, // Bridge Pavilion, Zaragoza
};
