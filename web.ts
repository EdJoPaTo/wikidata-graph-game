import { getImageUrl, isItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { GameState } from "./game-state.ts";
import { getSuperfamilies } from "./queries.ts";
import { randomItem } from "./helpers.ts";
import { search as wikidataSearch } from "./wikidata-search.ts";
import { getCached } from "./store.ts";

const searchInput = document.querySelector("#search") as HTMLInputElement;
const searchResults = document.querySelector("#searchresults") as HTMLElement;
const loadingView = document.querySelector("#loading") as HTMLElement;

type DrawDiagramFunction = (graphDefinition: string) => Promise<void> | void;
let drawDiagram: DrawDiagramFunction = () => {
	console.log("not yet initialized");
};
export function init(drawDiagramFunc: DrawDiagramFunction): void {
	drawDiagram = drawDiagramFunc;
}

const potentialTargets = await getSuperfamilies();
const gamestate = new GameState(randomItem(potentialTargets));
loadingView.hidden = true;
await gamestate.graph();

async function updateGraph() {
	loadingView.hidden = false;
	const graph = await gamestate.graph();
	await drawDiagram(graph.buildMermaid());
	loadingView.hidden = true;
}

searchInput.addEventListener("change", onSearch);
async function onSearch() {
	const { value } = searchInput;
	searchResults.innerHTML = "";
	loadingView.hidden = false;
	const results = await wikidataSearch(value, "de");
	loadingView.hidden = true;

	searchResults.innerHTML = results.map((
		{ id, taxonName, label, description },
	) => {
		const title = taxonName ? `${taxonName} (${label})` : label;
		const item = getCached(id);
		const styles: string[] = [];

		const image = item.images[0];
		if (image) {
			styles.push("background-image: url(" + getImageUrl(image) + ")");
		}

		return `<div class="searchresult ${id}" style="${styles.join(";")}">
<strong>${title}</strong>
<code>${id}</code>
<div>${description}</div>
</div>`;
	}).join("");

	for (const element of document.querySelectorAll(".searchresult")) {
		const itemId = [...element.classList].find(isItemId);
		if (!itemId) throw new Error("classes dark magic failed");
		element.addEventListener("click", async () => {
			gamestate.addGuess(itemId);
			searchResults.innerHTML = "";
			searchInput.value = "";
			await updateGraph();
		});
	}
}
