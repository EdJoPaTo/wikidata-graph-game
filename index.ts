import { getEntities, getItemParents } from "./wikidata.ts";

const TARGET = "Q83483"; // sea urchin
const entities = await getEntities([TARGET]);
const item = entities[TARGET]!;

if (item.type !== "item") {
	throw new Error("not an item");
}

console.log(getItemParents(item));

// const GUESSES = [
//   "Q146", // house cat
//   "Q21179", // Sønderborg
// ] as const;

// console.log(await getEntities([TARGET, ...GUESSES]));
