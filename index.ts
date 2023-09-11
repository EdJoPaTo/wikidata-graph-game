import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { GameState } from "./game-state.ts";

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

const gamestate = new GameState(TARGET);
for (const guess of GUESSES) {
	gamestate.addGuess(guess);
}

const graph = await gamestate.graph();

Deno.writeTextFileSync("graph.d2", graph.buildD2());
Deno.writeTextFileSync("graph.mermaid", graph.buildMermaid());
const command = new Deno.Command("d2", {
	args: [
		"--dark-theme=201",
		"graph.d2",
	],
}).outputSync();
if (!command.success) {
	throw new Error("d2 failed");
}
