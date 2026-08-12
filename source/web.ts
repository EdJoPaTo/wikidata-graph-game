import { isItemId, type ItemId, wikimediaLanguageCodes } from "wikibase-sdk";
import { GameState } from "./game-state.ts";
import { getTarget, TARGET_GROUPS, type TargetKind } from "./gametargets.ts";
import { randomItem } from "./helpers.ts";
import { getInterestingNodes } from "./parent-graph.ts";
import { bestEffortLabel } from "./simplify-item.ts";
import * as store from "./store.ts";
import { WdItem } from "./wd-item.ts";
import { showLoading, validLanguage } from "./web-helper.ts";
import { search as wikidataSearch } from "./wikidata-search.ts";

const clearCacheButton = document.querySelector(
	"#clearcache",
) as HTMLInputElement;
const hintButton = document.querySelector("#hint") as HTMLInputElement;
const ingameHeading = document.querySelector("#ingame h2") as HTMLElement;
const ingameInputs = document.querySelector("#ingame .inputs") as HTMLElement;
const languageSelect = document.querySelector("#language") as HTMLSelectElement;
const missingWikidataLabelInfo = document.querySelector(
	"#missingwikidatalabel",
) as HTMLDivElement;
const restartButton = document.querySelector("#restart") as HTMLInputElement;
const searchInput = document.querySelector("#search") as HTMLInputElement;
const searchResults = document.querySelector("#searchresults") as HTMLElement;
const viewIngame = document.querySelector("#ingame") as HTMLElement;
const viewTargetselection = document.querySelector(
	"#targetselection",
) as HTMLElement;

restartButton.addEventListener("click", () => window.location.reload());
document.querySelector("header > a")!.addEventListener(
	"click",
	() => window.location.reload(),
);

clearCacheButton.addEventListener("click", async () => {
	store.clear();
	await updateLabels();
});

function updateIngameHeading() {
	const itemId = ingameHeading.className;
	if (!isItemId(itemId)) return;
	const item = store.getCached(itemId);
	ingameHeading.innerText = bestEffortLabel(item, languageSelect.value) ??
		itemId;
}

languageSelect.innerHTML = wikimediaLanguageCodes.map((o) =>
	`<option value="${o}">${o}</option>`
).join("");
languageSelect.value =
	validLanguage(new URL(window.location.href).searchParams.get("lang")) ??
		validLanguage(navigator.language) ?? "en";
languageSelect.addEventListener("change", async () => {
	await updateLabels();

	const lang = languageSelect.value;
	searchInput.lang = lang;
	const url = new URL(window.location.href);
	url.searchParams.set("lang", lang);
	window.history.pushState({ path: url.toString() }, "", url);
});
async function updateLabels(): Promise<void> {
	searchInput.disabled =
		languageSelect.disabled =
		clearCacheButton.disabled =
			true;
	await Promise.all([
		loadTargets(),
		onSearch(),
		updateGraph(),
	]);
	updateIngameHeading();
	searchInput.disabled =
		languageSelect.disabled =
		clearCacheButton.disabled =
			false;
}

type DrawDiagramFunction = (graphDefinition: string) => Promise<void> | void;
let drawDiagram: DrawDiagramFunction = () => {
	console.log("not yet initialized");
};
export function init(drawDiagramFunc: DrawDiagramFunction): void {
	drawDiagram = drawDiagramFunc;
}

async function loadTargets() {
	showLoading(true);
	await store.cache(TARGET_GROUPS.map(([_kind, id]) => id));

	const targets = document.querySelector("#targets") as HTMLElement;
	targets.replaceChildren(...TARGET_GROUPS.map(([kind, id]) => {
		const element = new WdItem();
		element.setAttribute("lang", languageSelect.value);
		element.setAttribute("item-id", id);
		element.classList.add(kind, id);
		element.addEventListener("click", () => beginGame(kind, id));
		return element;
	}));

	showLoading(false);
}

let gamestate: GameState;
async function beginGame(kind: TargetKind, group: ItemId) {
	showLoading(true);
	viewTargetselection.hidden = true;
	ingameHeading.className = group;
	updateIngameHeading();
	viewIngame.hidden = false;

	const target = await getTarget(kind, group);
	gamestate = new GameState(target);
	gamestate.cache();
	ingameInputs.hidden = false;
	showLoading(false);
}

await loadTargets();

async function updateGraph() {
	if (!gamestate) return;
	showLoading(true);
	hintButton.hidden = true;
	await gamestate.cache();
	const graph = gamestate.graph(languageSelect.value);
	await drawDiagram(graph.buildMermaid());
	for (const element of document.querySelectorAll("g.node")) {
		const itemId = /Q\d+/.exec(element.id)?.[0];
		if (typeof itemId !== "string" || !isItemId(itemId)) continue;
		if (itemId === gamestate.target && !gamestate.isWon()) continue;
		element.outerHTML =
			`<a href="https://www.wikidata.org/wiki/${itemId}" class="${itemId}" target="_blank" rel="noopener">` +
			element.outerHTML + "</a>";
	}
	missingWikidataLabelInfo.hidden = !gamestate.hasMissingWikidataLabels(
		languageSelect.value,
	);
	hintButton.hidden = gamestate.hints().length === 0;
	searchInput.scrollIntoView();
	ingameInputs.hidden = gamestate.isWon();
	restartButton.hidden = !gamestate.isWon();
	if (gamestate.isWon()) searchInput.value = "";
	showLoading(false);
}

hintButton.addEventListener("click", async () => {
	hintButton.hidden = true;
	const hints = gamestate.hints();
	if (hints.length === 0) return;
	const hint = randomItem(hints);
	gamestate.addGuess(hint);
	searchInput.value = "";
	searchResults.innerHTML = "";
	await updateGraph();
});

searchInput.addEventListener("change", onSearch);
async function onSearch() {
	const { value } = searchInput;
	searchResults.innerHTML = "";
	if (!value) return;

	showLoading(true);
	const results = await wikidataSearch(value, languageSelect.value);
	const interesting = getInterestingNodes(
		gamestate.getAllParentLinks(),
		gamestate.target,
		[...gamestate.guesses],
	);
	const relevantResults = results
		.filter((id) => !interesting.has(id))
		.filter((id) => !gamestate.guesses.has(id));

	searchResults.replaceChildren(...relevantResults
		.map((id) => {
			const element = new WdItem();
			element.setAttribute("lang", languageSelect.value);
			element.setAttribute("item-id", id);
			element.classList.add(id);
			element.addEventListener("click", async () => {
				gamestate.addGuess(id);
				searchResults.innerHTML = "";
				searchInput.value = "";
				await updateGraph();
			});
			return element;
		}));
	showLoading(false);
	searchInput.scrollIntoView();
}
