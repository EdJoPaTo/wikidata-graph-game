import {
	getImageUrl,
	type ItemId,
	wikimediaLanguageCodes,
} from "https://esm.sh/wikibase-sdk@9.2.2";
import { getCached } from "./store.ts";
import { shortLang } from "./simplify-item.ts";

export function validLanguage(
	input: string | undefined | null,
): string | undefined {
	if (!input) return undefined;
	if ((wikimediaLanguageCodes as readonly string[]).includes(input)) {
		return input;
	}
	const short = shortLang(input);
	if (short && (wikimediaLanguageCodes as readonly string[]).includes(short)) {
		return short;
	}
	return undefined;
}

export function setImageAsBackground(element: HTMLElement, id: ItemId): void {
	const item = getCached(id);
	const image = item.images[0];
	if (image) {
		element.style.backgroundImage = 'url("' + getImageUrl(image, 450) + '")';
	}
}

export function showLoading(state: boolean): void {
	for (const element of document.querySelectorAll(".loading")) {
		(element as HTMLElement).hidden = !state;
	}
}
