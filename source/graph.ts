type Shape = "target" | "guess" | "between";

interface Link {
	readonly start: string;
	readonly end: string;
	readonly comment?: string;
}

export class Graph {
	#labels = new Map<string, string>();
	#shapes = new Map<string, Shape>();

	#links = new Set<Link>();

	setLabel(key: string, label: string | undefined): void {
		if (label) {
			this.#labels.set(key, label);
		}
	}

	setShape(key: string, shape: Shape): void {
		this.#shapes.set(key, shape);
	}

	addLink(start: string, end: string, comment?: string): void {
		if (start === end) return;
		this.#links.add({ start, end, comment });
	}

	buildD2(): string {
		const out: string[] = [
			...[...this.#labels]
				.map(([key, label]) => `${key}: ${label}`),
			...[...this.#shapes]
				.map(([key, shape]) => `${key}.shape: ${d2shape(shape)}`),
			...[...this.#links]
				.map(({ start, end, comment }) => {
					let link = `${start} -> ${end}`;
					if (comment) {
						link += ": " + comment;
					}
					return link;
				}),
		];
		return out.join("\n") + "\n";
	}

	/** https://mermaid.live */
	buildMermaid(): string {
		const contentLines: string[] = [...this.#links]
			.map(({ start, end, comment }) => {
				let link = `${start} -->`;
				if (comment) {
					link += "|" + comment + "|";
				}
				link += " " + end;
				return link;
			});

		for (const [key, label] of this.#labels) {
			const shape: Shape = this.#shapes.get(key) ?? "between";
			if (shape === "target") {
				contentLines.push(`${key}{"${label}"}`);
			} else if (shape === "guess") {
				contentLines.push(`${key}("${label}")`);
			} else {
				contentLines.push(`${key}["${label}"]`);
			}
		}

		const content = contentLines.map((o) => `\t${o}`).join("\n");

		return "graph TD\n" + content + "\n";
	}
}

function d2shape(shape: Shape) {
	if (shape === "guess") return "oval";
	if (shape === "target") return "hexagon";
	return "rectangle";
}
