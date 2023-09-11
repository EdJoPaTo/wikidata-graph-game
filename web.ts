import { isItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { GameState } from "./game-state.ts";
import { search as wikidataSearch } from "./wikidata-search.ts";

const gamestate = new GameState("Q83483"); // sea urchin

async function updateGraph() {
	loadingView.hidden = false;
	const graph = await gamestate.graph();
	await drawDiagram(graph.buildMermaid());
	loadingView.hidden = true;
}

type DrawDiagramFunction = (graphDefinition: string) => Promise<void> | void;
let drawDiagram: DrawDiagramFunction = () => {
	console.log("not yet initialized");
};
export async function init(
	drawDiagramFunc: DrawDiagramFunction,
): Promise<void> {
	drawDiagram = drawDiagramFunc;
	await updateGraph();
}

const searchInput = document.querySelector("#search") as HTMLInputElement;
searchInput.addEventListener("change", onSearch);
const searchResults = document.querySelector("#searchresults") as HTMLElement;
const loadingView = document.querySelector("#loading") as HTMLElement;

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

		return `<article class="searchresult ${id}">
<h2>${title}</h2>
<pre>${id}</pre>
<span>${description}</span>
</article>`;
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

searchInput.value = "Taraxacum";
await onSearch();
