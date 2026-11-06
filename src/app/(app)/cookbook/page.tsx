import { RECIPES, PREP_CALCULATORS, DIP_RECIPES } from "@/lib/cookbook";
import { CookbookList } from "./cookbook-list";
import { PrepCalculatorList } from "./prep-list";
import { DipRecipeList } from "./dip-list";

export default function CookbookPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cookbook</h1>
          <p className="text-sm text-muted-foreground">
            Production recipes, scalable by their anchor ingredient.
          </p>
        </div>

        <CookbookList recipes={RECIPES} />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Prep &amp; Base Ingredients</h2>
          <p className="text-sm text-muted-foreground">
            Sub-recipes used elsewhere in production — not scaled by dough units.
          </p>
        </div>

        <PrepCalculatorList items={PREP_CALCULATORS} />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Dips</h2>
          <p className="text-sm text-muted-foreground">
            Scaled by their anchor ingredient, yield shown in cups.
          </p>
        </div>

        <DipRecipeList recipes={DIP_RECIPES} />
      </div>
    </div>
  );
}
