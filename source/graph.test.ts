import { strictEqual } from "node:assert";
import { test } from "node:test";
import { Graph } from "./graph.ts";

test("d2 empty", () => {
	const graph = new Graph();
	const output = graph.buildD2();
	strictEqual(output, "\n");
});

test("d2 simple link", () => {
	const graph = new Graph();
	graph.addLink("a", "b");
	const output = graph.buildD2();
	strictEqual(output, "a -> b\n");
});

test("d2 simple label", () => {
	const graph = new Graph();
	graph.setLabel("o", "Omega");
	const output = graph.buildD2();
	strictEqual(output, "o: Omega\n");
});

test("mermaid empty", () => {
	const graph = new Graph();
	const output = graph.buildMermaid();
	strictEqual(output, "graph TD\n\n");
});

test("mermaid simple link", () => {
	const graph = new Graph();
	graph.addLink("a", "b");
	const output = graph.buildMermaid();
	strictEqual(output, "graph TD\n\ta --> b\n");
});

test("mermaid simple label", () => {
	const graph = new Graph();
	graph.setLabel("o", "Omega");
	const output = graph.buildMermaid();
	strictEqual(output, 'graph TD\n\to["Omega"]\n');
});
