import {
	isItemId,
	type ItemId,
	wikimediaLanguageCodes,
} from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortDescription, bestEffortLabel } from "./simplify-item.ts";
import { cache, getCached } from "./store.ts";
import { GameState } from "./game-state.ts";
import { getTarget, TARGET_GROUPS, TargetKind } from "./gametargets.ts";
import { randomItem } from "./helpers.ts";
import { search as wikidataSearch } from "./wikidata-search.ts";
import {
	setImageAsBackground,
	showLoading,
	validLanguage,
} from "./web-helper.ts";

const hintButton = document.querySelector("#hint") as HTMLInputElement;
const languageSelect = document.querySelector("#language") as HTMLSelectElement;
const restartButton = document.querySelector("#restart") as HTMLInputElement;
const searchInput = document.querySelector("#search") as HTMLInputElement;
const searchResults = document.querySelector("#searchresults") as HTMLElement;
const viewTargetselection = document.querySelector(
	"#targetselection",
) as HTMLElement;
const viewIngame = document.querySelector("#ingame") as HTMLElement;
const ingameInputs = document.querySelector("#ingame .inputs") as HTMLElement;
const ingameHeading = document.querySelector("#ingame h2") as HTMLElement;

restartButton.addEventListener("click", () => window.location.reload());
document.querySelector("header > a")!.addEventListener(
	"click",
	() => window.location.reload(),
);

function updateIngameHeading() {
	const itemId = ingameHeading.className;
	if (!isItemId(itemId)) return;
	const item = getCached(itemId);
	ingameHeading.innerText = bestEffortLabel(item, languageSelect.value) ??
		itemId;
}

languageSelect.innerHTML = wikimediaLanguageCodes.map((o) =>
	`<option value="${o}">${o}</option>`
).join("");
languageSelect.value =
	validLanguage(new URL(window.location.href).searchParams.get("lang")) ??
		validLanguage(navigator.language) ?? "en";
languageSelect.addEventListener("change", () => {
	const lang = languageSelect.value;
	searchInput.lang = lang;

	loadTargets();
	onSearch();
	updateGraph();
	updateIngameHeading();

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

async function loadTargets() {
	showLoading(true);
	await cache(TARGET_GROUPS.map(([_kind, id]) => id));

	const targets = document.querySelector("#targets") as HTMLElement;
	targets.innerHTML = TARGET_GROUPS.map(([kind, id]) => {
		const item = getCached(id);
		const title = bestEffortLabel(item, languageSelect.value);
		const descriptionText = bestEffortDescription(item, languageSelect.value);
		const description = descriptionText ? `<div>${descriptionText}</div>` : "";

		return `<a href="#" class="${kind} ${id}">
<strong>${title}</strong>
<code>${id}</code>
${description}
</a>`;
	}).join("");

	for (const [kind, id] of TARGET_GROUPS) {
		const element = document.querySelector(
			`#targets .${kind}.${id}`,
		) as HTMLElement;
		setImageAsBackground(element, id);
		element.addEventListener("click", async () => {
			await beginGame(kind, id);
		});
	}

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
	showLoading(true);
	hintButton.hidden = true;
	await gamestate.cache();
	const graph = gamestate.graph(languageSelect.value);
	await drawDiagram(graph.buildMermaid());
	for (const element of document.querySelectorAll("g.node")) {
		const itemId = /Q\d+/.exec(element.id)?.[0];
		if (typeof itemId !== "string" || !isItemId(itemId)) continue;
		if (itemId === gamestate.target) continue;
		element.outerHTML =
			`<a href="https://www.wikidata.org/wiki/${itemId}" class="${itemId}" target="_blank" rel="noopener">` +
			element.outerHTML + "</a>";
	}
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
	await updateGraph();
});

searchInput.addEventListener("change", onSearch);
async function onSearch() {
	const { value } = searchInput;
	searchResults.innerHTML = "";
	if (!value) return;

	showLoading(true);
	const results = await wikidataSearch(value, languageSelect.value);
	const relevantResults = results
		.filter((o) => !gamestate.guesses.has(o.id));

	searchResults.innerHTML = relevantResults
		.map(({ id, taxonName, label, description }) => {
			const title = taxonName ? `${taxonName} (${label})` : label;
			return `<a href="#" class="${id}">
<strong>${title}</strong>
<code>${id}</code>
<div>${description}</div>
</a>`;
		}).join("");

	for (const { id } of relevantResults) {
		const element = document.querySelector(
			`#searchresults .${id}`,
		) as HTMLElement;
		setImageAsBackground(element, id);

		element.addEventListener("click", async () => {
			gamestate.addGuess(id);
			searchResults.innerHTML = "";
			searchInput.value = "";
			await updateGraph();
		});
	}
	showLoading(false);
	searchInput.scrollIntoView();
}
