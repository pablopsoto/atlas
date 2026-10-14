// Säynätsalo Town Hall, Finland (Alvar Aalto, 1952). Red brick round a courtyard raised a
// storey above the street: the offices and council wing on the north and east, shops with
// flats over them to the south, and the library standing apart on the west, glazed below
// and banded with timber louvres above. The council chamber rises over the south-west corner,
// beside the stone steps, as a near-cubic brick tower over a strip of clerestory glass. Grass steps climb
// into the court from the north-west, stone steps from the south-west. South is +z.
import { rect, type Kit, type ModelInfo, type P2 } from '../kit';

const COURT = 3.4; // courtyard level
const EAVE = 9.6; // the two-storey wings, from the street

function build(k: Kit) {
  // ——— The raised courtyard: a terrace of earth held by the buildings ———
  k.prism(rect(19, 17, 0, 0), 0, COURT);

  // ——— The wings round it ———
  const wing = (outline: P2[], h = EAVE) => {
    k.prism(outline, 0, h);
    k.prism(outline, h, 0.25); // the thin roof edge
  };
  wing([[-12, -17], [17, -17], [17, -8.5], [-12, -8.5]]); // north: offices
  wing([[9.5, -8.5], [17, -8.5], [17, 13], [9.5, 13]]); // east
  wing([[-7.5, 8.5], [9.5, 8.5], [9.5, 15.5], [-7.5, 15.5]]); // south: shops and flats
  // Windows: a row of upper-floor openings on the outer faces of the wings.
  for (let x = -6.5; x < 9; x += 2.4) k.box(x, 5.4, 15.55, 1.0, 1.5, 0.12);
  for (let z = -15.5; z < 12.5; z += 2.4) k.box(17.05, 5.6, z, 0.12, 1.5, 1.0);
  for (let x = -11; x < 16; x += 2.4) k.box(x, 5.6, -17.05, 1.0, 1.5, 0.12);
  // Shop windows along the south street front, recessed.
  k.glazing([-7.3, 15.5], [9.3, 15.5], 0.3, 2.8, 2.2, { bar: 0.1, inset: 0.25 });
  // Office windows into the courtyard: a row of deep openings on each inner face.
  for (let x = -10; x < 9; x += 2.6) k.box(x, COURT + 1.0, -8.45, 1.2, 1.4, 0.2);
  for (let z = -6; z < 8; z += 2.6) k.box(9.45, COURT + 1.0, z, 0.2, 1.4, 1.2);
  // The glazed corridor along the court on the north side.
  k.glazing([-11.5, -8.5], [9.3, -8.5], COURT, 2.8, 1.3, { bar: 0.08, inset: 0.2 });

  // ——— The council chamber: a brick tower over a strip of clerestory glass ———
  const cx = -2.5;
  const cz = 11.8;
  const cw = 9.6;
  const cd = 7.6;
  k.box(cx, EAVE, cz, cw - 1.2, 1.1, cd - 1.2); // the clerestory band, set back
  k.glazing([cx - cw / 2 + 0.6, cz + cd / 2 - 0.6], [cx + cw / 2 - 0.6, cz + cd / 2 - 0.6], EAVE, 1.1, 0.8, { bar: 0.06, inset: 0 });
  // The tower above it, its roof pitched up to the north.
  k.fin([[cx - cw / 2, EAVE + 1.1], [cx + cw / 2, EAVE + 1.1], [cx + cw / 2, EAVE + 9.2], [cx - cw / 2, EAVE + 9.2]], cd, 0, [0, cz]);
  k.fin([[cz - cd / 2, EAVE + 9.2], [cz + cd / 2, EAVE + 9.2], [cz + cd / 2, EAVE + 9.2], [cz - cd / 2, EAVE + 10.2]], cw, Math.PI / 2, [cx, 0]);

  // ——— The library, standing apart on the west ———
  const lib = rect(11, 19, -17, 3.5);
  k.prism(lib, 0, 0.3);
  k.glazing([-22.5, 13], [-11.5, 13], 0.3, 3.0, 2.0, { bar: 0.1, inset: 0.3 }); // the glazed ground floor
  k.glazing([-22.5, -6], [-22.5, 13], 0.3, 3.0, 2.2, { bar: 0.1, inset: -0.3 });
  k.box(-17, 0.3, 3.5, 10, 3.0, 18); // behind the glass
  k.box(-17, 3.3, 3.5, 11, 5.2, 19); // the brick upper floor
  // Its band of timber louvres high on the south and west faces.
  for (let x = -22.3; x < -11.6; x += 0.55) k.box(x, 6.0, 13.1, 0.12, 2.3, 0.35);
  for (let z = -5.8; z < 12.9; z += 0.55) k.box(-22.6, 6.0, z, 0.35, 2.3, 0.12);
  k.box(-17, 8.5, 3.5, 11.4, 0.25, 19.4);

  // ——— The steps up to the court ———
  // Grass steps (timber edged) from the north-west, between the library and the offices.
  k.stairs([-17, -16], [-10, -11], 0, COURT, 4.6, 7);
  // Stone steps from the south-west, between the library and the shops.
  k.stairs([-10, 16], [-9.5, 9.5], 0, COURT, 3.2, 12);
}

export default { title: 'Säynätsalo Town Hall', build } satisfies ModelInfo;
