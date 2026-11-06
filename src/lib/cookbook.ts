export interface RecipeComponentPct {
  label: string;
  percentOfFlour: number; // baker's percentage, relative to flour = 100
}

export interface RecipePreset {
  label: string;
  units: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  unit: {
    label: string; // e.g. "knot"
    grossWeightGrams: number; // raw dough weight of one unit
    unitsPerOrder: number;
    unitsPerBag: number; // yield per 50 lb flour bag
  };
  components: RecipeComponentPct[];
  presets: RecipePreset[];
  defaultUnits: number;
  steps: string[];
  notes: string[];
}

export const RECIPES: Recipe[] = [
  {
    id: "pretzel-knot-dough",
    name: "Pretzel Knot Dough",
    description:
      "Standardized frozen dough knot recipe, scaled by knot count. Divide, shape, and blast-freeze as blanks — no proof, no par-bake. (No carbonate bath here — that's a truck step at the event, not dough prep.)",
    unit: { label: "knot", grossWeightGrams: 113.3981, unitsPerOrder: 4, unitsPerBag: 345.4 },
    components: [
      { label: "Water (iced)", percentOfFlour: 55 },
      { label: "Butter, unsalted, softened", percentOfFlour: 7 },
      { label: "Brown sugar, packed", percentOfFlour: 7 },
      { label: "Fine salt", percentOfFlour: 2.5 },
      { label: "Instant yeast", percentOfFlour: 1.2 },
    ],
    presets: [
      { label: "1 order (4)", units: 4 },
      { label: "1 window batch (80)", units: 80 },
      { label: "1 bag (345)", units: 345 },
      { label: "500", units: 500 },
    ],
    defaultUnits: 80,
    steps: [
      "Gather all ingredients and scale each to its gram target.",
      "Ice the water down cold before mixing (keeps finished dough temp ~72–75°F).",
      "Mix the dry: flour, salt, instant yeast.",
      "Add the softened butter.",
      "Add the brown sugar dissolved in the cold water. Mix to a stiff, developed dough.",
      "Divide to 4 oz (113.40 g) pieces, shape into knots, and freeze as blanks — no proof, no par-bake.",
    ],
    notes: [
      "Baker's %: flour 100 / water 55 / butter 7 / brown sugar 7 / salt 2.5 / instant yeast 1.2. Batch factor (total dough ÷ flour) = 1.727.",
      "1 knot = 4 oz (113.40 g) raw dough. 4 knots = 1 order (16 oz plate). Yield ≈ 345 knots / ≈ 86 orders per 50 lb flour bag.",
      "No carbonate bath in this tool — bathing is a truck step at the event, not part of dough prep.",
    ],
  },
];

export interface ScaledRecipe {
  flourGrams: number;
  componentAmounts: (RecipeComponentPct & { grams: number })[];
  totalGrams: number;
  orders: number;
  bags: number;
}

export function scaleRecipe(recipe: Recipe, units: number): ScaledRecipe {
  const safeUnits = Number.isFinite(units) && units > 0 ? units : 0;
  const batchFactor =
    1 + recipe.components.reduce((sum, c) => sum + c.percentOfFlour, 0) / 100;

  const flourGrams = (safeUnits * recipe.unit.grossWeightGrams) / batchFactor;

  const componentAmounts = recipe.components.map((component) => ({
    ...component,
    grams: flourGrams * (component.percentOfFlour / 100),
  }));

  const totalGrams =
    flourGrams + componentAmounts.reduce((sum, component) => sum + component.grams, 0);

  return {
    flourGrams,
    componentAmounts,
    totalGrams,
    orders: safeUnits / recipe.unit.unitsPerOrder,
    bags: safeUnits / recipe.unit.unitsPerBag,
  };
}

const GRAMS_PER_OZ = 28.349523125;
const GRAMS_PER_LB = GRAMS_PER_OZ * 16;

export function formatWeight(grams: number): string {
  const gramsLabel = `${grams.toLocaleString(undefined, { maximumFractionDigits: 1 })} g`;
  if (grams < GRAMS_PER_LB) return gramsLabel;

  const totalOz = Math.round((grams / GRAMS_PER_OZ) * 10) / 10;
  const lb = Math.floor(totalOz / 16);
  const oz = totalOz - lb * 16;
  return `${gramsLabel} (${lb} lb ${oz.toLocaleString(undefined, { maximumFractionDigits: 1 })} oz)`;
}

/**
 * A "forward yield" prep calculator: one input weight in, one derived
 * output weight out (input * yieldPct/100). Not a Recipe — no
 * baker's-percentage components, no presets-as-unit-multiples, no
 * orders/bags concept. Used for base-ingredient sub-recipes like baked
 * baking soda, where the only variable is "how much did you start with."
 */
export interface PrepCalculator {
  id: string;
  name: string;
  category: string;
  description: string;
  inputLabel: string;
  yieldPct: number; // finished weight as % of input
  defaultInputGrams: number;
  steps: string[];
  notes: string[];
}

export const PREP_CALCULATORS: PrepCalculator[] = [
  {
    id: "baked-baking-soda",
    name: "Baked Baking Soda",
    category: "Pretzel Dip / Base Ingredient",
    description:
      "Baking soda (NaHCO3) heated converts to sodium carbonate (Na2CO3): 2 NaHCO3 → Na2CO3 + H2O + CO2. The baked soda is later dissolved in hot water for the pretzel dip bath — that ratio is a separate recipe, not covered here.",
    inputLabel: "Raw baking soda (starting weight)",
    yieldPct: 63,
    defaultInputGrams: 454,
    steps: [
      "Preheat oven to 250°F (120°C).",
      "Spread baking soda in a thin, even layer (~1/4 inch deep) on a rimmed baking sheet, lined with parchment or foil.",
      "Bake 1 hour, stirring/redistributing at the 30-minute mark so it converts evenly.",
      "Remove and cool completely.",
      "Break up any clumps and sift or whisk to a fine, uniform powder.",
    ],
    notes: [
      "Baker's %: baking soda = 100% (single ingredient, no other components).",
      "Expected yield ≈ 63% of starting weight (37% lost as water vapor + CO2). Actual yield can vary a couple points by oven and layer thickness — weigh the finished batch rather than assuming exactly 63%.",
      "Store airtight at room temperature — it readily reabsorbs moisture from air, which causes clumping and reduces potency.",
    ],
  },
];

export interface PrepResult {
  inputGrams: number;
  outputGrams: number;
  yieldPct: number;
}

export function calculatePrepYield(calc: PrepCalculator, inputGrams: number): PrepResult {
  const safeInput = Number.isFinite(inputGrams) && inputGrams > 0 ? inputGrams : 0;
  return {
    inputGrams: safeInput,
    outputGrams: safeInput * (calc.yieldPct / 100),
    yieldPct: calc.yieldPct,
  };
}

export interface DipPreset {
  label: string;
  grams: number;
}

/**
 * A baker's-percentage recipe scaled by directly entering the anchor
 * ingredient's weight (not a unit count run through a batch factor, like
 * Recipe/scaleRecipe). Yield is read out in portions (cups), not
 * orders/bags.
 */
export interface DipRecipe {
  id: string;
  name: string;
  category: string;
  description: string;
  anchorLabel: string;
  components: RecipeComponentPct[]; // percent of anchor weight
  portionGrams: number;
  presets: DipPreset[];
  defaultGrams: number;
  steps: string[];
  notes: string[];
}

export const DIP_RECIPES: DipRecipe[] = [
  {
    id: "sweet-cream-cheese-dip",
    name: "Sweet Cream Cheese Dip",
    category: "Dips — sweet",
    description:
      "Cold sweet dip for cinnamon sugar knots — held at 41°F or below, never warmed. Scaled by cream cheese weight; every other ingredient is a percentage of it.",
    anchorLabel: "Cream cheese, full-fat",
    components: [
      { label: "Powdered sugar, 10x", percentOfFlour: 85 },
      { label: "Heavy cream", percentOfFlour: 30 },
      { label: "Unsalted butter", percentOfFlour: 15 },
      { label: "Vanilla extract", percentOfFlour: 1.5 },
      { label: "Fine salt", percentOfFlour: 0.4 },
    ],
    portionGrams: 45,
    presets: [
      { label: "Test batch (227 g)", grams: 227 },
      { label: "Production batch (1360 g / 3 lb)", grams: 1360 },
    ],
    defaultGrams: 227,
    steps: [
      "Temper cream cheese and butter to 65–70°F.",
      "Paddle cream cheese and butter on low until fully smooth. Low speed only — aeration causes weeping.",
      "Add powdered sugar, vanilla, and salt. Mix on low just to combined, then scrape the bowl fully.",
      "Add the cream in two additions on low. Stop slightly thicker than target — it firms as it chills.",
      "Scoop into cups, lid, and date mark.",
      "Chill to 41°F before service.",
    ],
    notes: [
      "Baker's %: cream cheese 100 / powdered sugar 85 / heavy cream 30 / butter 15 / vanilla 1.5 / salt 0.4. Batch factor (total ÷ cream cheese) ≈ 2.319 (≈232%).",
      "Portion: #20 disher (1.6 fl oz, ~45 g) scooped as a dome into a 3.25 oz cup — do not pour or level-fill. The 3.25 oz sweet cup and 4 oz savory cup share a GFS lid.",
      "Service: cold, held at 41°F or below, never warmed. Pairs with cinnamon sugar knots.",
      "QC (verify at 41°F, not room temperature): a knot dips without tearing; the scoop holds a visible dome under the lid. Adjust cream ±2% of cream cheese weight, one change per batch — record the final cream percentage.",
      "Storage: 41°F or below, date-marked every batch. 7 days maximum from prep day (prep day = day 1). Ready-to-eat TCS food — date marking required.",
      "Cost (GFS, as of Sept 2026): cream cheese $0.13/oz · powdered sugar $0.07/oz · heavy cream $0.12/fl oz · butter $0.15/oz · vanilla $1.87/fl oz. Production batch ≈ $13.27 → ≈ $0.19 per cup.",
      "Status: unvalidated — cream percentage is provisional until the 41°F test is run. Don't scale to production until the final cream number is recorded.",
    ],
  },
];

export interface ScaledDipRecipe {
  anchorGrams: number;
  componentAmounts: (RecipeComponentPct & { grams: number })[];
  totalGrams: number;
  cups: number;
}

export function scaleDipRecipe(recipe: DipRecipe, anchorGrams: number): ScaledDipRecipe {
  const safeAnchor = Number.isFinite(anchorGrams) && anchorGrams > 0 ? anchorGrams : 0;

  const componentAmounts = recipe.components.map((component) => ({
    ...component,
    grams: safeAnchor * (component.percentOfFlour / 100),
  }));

  const totalGrams =
    safeAnchor + componentAmounts.reduce((sum, component) => sum + component.grams, 0);

  return {
    anchorGrams: safeAnchor,
    componentAmounts,
    totalGrams,
    cups: totalGrams / recipe.portionGrams,
  };
}
