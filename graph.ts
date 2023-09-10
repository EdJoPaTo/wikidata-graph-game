export class Graph {
	#labels = new Map<string, string>();
	#shapes = new Map<string, string>();

	#links = new Set<string>();

	setLabel(key: string, label: string | undefined): void {
		if (label) {
			this.#labels.set(key, label);
		}
	}

	setShape(key: string, shape: string): void {
		this.#shapes.set(key, shape);
	}

	addLink(start: string, end: string, comment?: string): void {
		if (start === end) return;

		let link = `${start} -> ${end}`;
		if (comment) {
			link += ": " + comment;
		}

		this.#links.add(link);
	}

	build(): string {
		const out: string[] = [
			...[...this.#labels]
				.map(([key, label]) => `${key}: ${label}`),
			...[...this.#shapes]
				.map(([key, label]) => `${key}.shape: ${label}`),
			...this.#links,
		];
		return out.join("\n") + "\n";
	}
}
