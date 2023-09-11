import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortLabel, getItemParents } from "./wikidata.ts";
import { Graph } from "./graph.ts";
import { Parents } from "./parents.ts";
import * as store from "./store.ts";

const TARGET = "Q83483"; // sea urchin
const GUESSES: readonly ItemId[] = [
	// "Q10321095", // Otter which doesnt work well
	// "Q11019", // machine
	// "Q11687", // Springspinne
	"Q123141", // Goldfish
	"Q127470", // Seegurke
	// "Q13235160", // manufacturer
	// "Q140", // lion
	// "Q146", // house cat
	// "Q15083", // Giraffe
	// "Q15504328", // Salmoninae
	// "Q15978631", // human
	// "Q192272", // Mammut
	// "Q200184", // Otter
	// "Q204175", // Hamster
	// "Q2258881", // Trout
	// "Q25265", // Felidae (from house cat)
	"Q25349", // Starfish
	"Q25407", // Bumble bee
	// "Q25900", // Familiy of Rabbit
	"Q2699803", // Sea gull
	"Q53663", // Salamander
	// "Q59166", // Quastenflossler
	// "Q611843", // Octopus
	// "Q6120", // Hedgehog
	// "Q783794", // company
	// "Q79803", // Cuy (Guinea pig)
	// "Q830", // cattle
	// "Q83310", // Hausmaus
	"Q83483", // Sea urchin
	// "Q9482", // squirrel
	// "Q9490", // Gleithörnchen
];

async function cacheWithParents(ids: ItemId[]): Promise<void> {
	const missing = await store.cache(ids);
	const next: ItemId[] = [];
	for (const id of missing) {
		const parents = getItemParents(store.getCached(id)!);
		next.push(...parents);
	}
	if (next.length > 0) {
		await cacheWithParents(next);
	}
}

store.load();
await cacheWithParents([TARGET, ...GUESSES]);
store.save();

const graph = new Graph();
const interesting = new Set<ItemId>([TARGET, ...GUESSES]);

for (const aId of interesting) {
	const aParents = new Parents(aId);
	for (const bId of interesting) {
		if (aId === bId) continue;
		const bParents = new Parents(bId);
		const commonParents = aParents.getCommonMinimumDistance(bParents);
		for (const parent of commonParents) {
			interesting.add(parent);
		}
	}
}

for (const id of interesting) {
	const item = store.getCached(id)!;
	graph.setLabel(id, bestEffortLabel(item));

	const parents = new Parents(id).getMinimumDistance(
		[...interesting].filter((o) => o !== id),
	);
	for (const parent of parents) {
		graph.addLink(parent, id);
	}
}

for (const id of GUESSES) {
	graph.setShape(id, "oval");
}

graph.setShape(TARGET, "hexagon");
graph.setLabel(
	TARGET,
	GUESSES.includes(TARGET)
		? bestEffortLabel(store.getCached(TARGET)!)
		: "guess me",
);

Deno.writeTextFileSync("graph.d2", graph.build());
const command = new Deno.Command("d2", {
	args: [
		"--dark-theme=201",
		"graph.d2",
	],
}).outputSync();
if (!command.success) {
	throw new Error("d2 failed");
}
