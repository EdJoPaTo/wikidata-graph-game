import {
	getImageUrl,
	isItemId,
	wikimediaLanguageCodes,
} from "https://esm.sh/wikibase-sdk@9.2.2";
import { GameState } from "./game-state.ts";
import { getSuperfamilies } from "./queries.ts";
import { randomItem } from "./helpers.ts";
import { search as wikidataSearch } from "./wikidata-search.ts";
import { getCached } from "./store.ts";

const hintButton = document.querySelector("#hint") as HTMLInputElement;
const languageSelect = document.querySelector("#language") as HTMLSelectElement;
const loadingView = document.querySelector("#loading") as HTMLElement;
const restartButton = document.querySelector("#restart") as HTMLInputElement;
const searchInput = document.querySelector("#search") as HTMLInputElement;
const searchResults = document.querySelector("#searchresults") as HTMLElement;

languageSelect.innerHTML = wikimediaLanguageCodes.map((o) =>
	`<option value="${o}">${o}</option>`
).join("");
function validLanguage(input: string | undefined | null): string | undefined {
	if (!input) return undefined;
	if ((wikimediaLanguageCodes as readonly string[]).includes(input)) {
		return input;
	}
	const short = input.split("-")[0];
	if (short && (wikimediaLanguageCodes as readonly string[]).includes(short)) {
		return short;
	}
	return undefined;
}
languageSelect.value =
	validLanguage(new URL(window.location.href).searchParams.get("lang")) ??
		validLanguage(navigator.language) ?? "en";
languageSelect.addEventListener("change", () => {
	const lang = languageSelect.value;
	searchInput.lang = lang;

	updateGraph();
	onSearch();

	const url = new URL(window.location.href);
	url.searchParams.set("lang", lang);
	window.history.pushState({ path: url.toString() }, "", url);
});

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
gamestate.cache();

async function updateGraph() {
	loadingView.hidden = false;
	hintButton.hidden = true;
	await gamestate.cache();
	const graph = gamestate.graph(languageSelect.value);
	await drawDiagram(graph.buildMermaid());
	hintButton.hidden = gamestate.isWon() || gamestate.hints().length === 0;
	restartButton.hidden = !gamestate.isWon();
	searchInput.scrollIntoView();
	searchInput.hidden = gamestate.isWon();
	if (gamestate.isWon()) searchInput.value = "";
	loadingView.hidden = true;
}

hintButton.addEventListener("click", async () => {
	hintButton.hidden = true;
	const hints = gamestate.hints();
	if (hints.length === 0) return;
	const hint = randomItem(hints);
	gamestate.addGuess(hint);
	await updateGraph();
});

searchInput.addEventListener("change", onSearch);
async function onSearch() {
	const { value } = searchInput;
	searchResults.innerHTML = "";
	if (!value) return;

	loadingView.hidden = false;
	const results = await wikidataSearch(value, languageSelect.value);

	searchResults.innerHTML = results
		.filter((o) => !gamestate.guesses.has(o.id))
		.map(({ id, taxonName, label, description }) => {
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

	loadingView.hidden = true;
	searchResults.scrollIntoView();
}
