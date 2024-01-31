import { wikimediaLanguageCodes } from "https://esm.sh/wikibase-sdk@9.2.4";
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

export function showLoading(state: boolean): void {
	for (const element of document.querySelectorAll(".loading")) {
		(element as HTMLElement).hidden = !state;
	}
}
