import type { ItemId } from "wikibase-sdk";
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
	"Q19610691", // domestic cattle
	// "Q200184", // Otter
	// "Q204175", // Hamster
	// "Q2258881", // Trout
	// "Q25265", // Felidae (from house cat)
	"Q25349", // Starfish
	"Q25407", // Bumble bee
	// "Q25900", // Familiy of Rabbit
	"Q2699803", // Sea gull
	// "Q308841", // Schnecke
	"Q53663", // Salamander
	// "Q59166", // Quastenflossler
	// "Q611843", // Octopus
	// "Q6120", // Hedgehog
	// "Q7386", // Ameisen
	// "Q783794", // company
	// "Q79803", // Cuy (Guinea pig)
	// "Q830", // cattle
	// "Q83310", // Hausmaus
	"Q83483", // Sea urchin
	// "Q9482", // squirrel
	// "Q9490", // Gleithörnchen
	// "Q971343", // Fledermaus
];

const gamestate = new GameState(TARGET);
for (const guess of GUESSES) {
	gamestate.addGuess(guess);
}

await gamestate.cache();
const graph = gamestate.graph("de");
console.log("hints", gamestate.hints());

Deno.writeTextFileSync("graph.d2", graph.buildD2());
