import { getImageUrl, isItemId, type ItemId } from "wikibase-sdk";
import { bestEffortDescription, bestEffortLabel } from "./simplify-item.ts";
import { getCached } from "./store.ts";

const ATTRIBUTES = [
	"item-id",
	"lang",
] as const;
type Attribute = typeof ATTRIBUTES[number];

export class WdItem extends HTMLElement {
	private _itemId?: ItemId = undefined;

	constructor() {
		super();
	}

	static observedAttributes = ATTRIBUTES;

	attributeChangedCallback(
		name: Attribute,
		_oldValue: string,
		newValue: string,
	): void {
		if (name === "item-id") {
			this._itemId = isItemId(newValue) ? newValue : undefined;
		}

		this._render();
	}

	connectedCallback(): void {
		this._render();
	}

	private _render(): void {
		this.replaceChildren();
		if (!this._itemId) return;

		const item = getCached(this._itemId);
		const language = this.lang ?? "en";

		const element = document.createElement("a");
		element.href = "#";

		const title = bestEffortLabel(item, language);
		if (title) {
			const node = document.createElement("strong");
			node.innerText = title;
			element.appendChild(node);
		}

		{
			const node = document.createElement("code");
			node.innerText = this._itemId;
			element.appendChild(node);
		}

		const description = bestEffortDescription(item, language);
		if (description) {
			const node = document.createElement("div");
			node.innerText = description;
			element.appendChild(node);
		}

		const image = item.images[0];
		if (image) {
			element.style.backgroundImage = 'url("' + getImageUrl(image, 450) + '")';
		}

		this.appendChild(element);
	}
}

customElements.define("wd-item", WdItem);
