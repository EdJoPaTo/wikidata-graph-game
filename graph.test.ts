import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { Graph } from "./graph.ts";

Deno.test("d2 empty", () => {
	const graph = new Graph();
	const output = graph.buildD2();
	assertEquals(output, "\n");
});

Deno.test("d2 simple link", () => {
	const graph = new Graph();
	graph.addLink("a", "b");
	const output = graph.buildD2();
	assertEquals(output, "a -> b\n");
});

Deno.test("d2 simple label", () => {
	const graph = new Graph();
	graph.setLabel("o", "Omega");
	const output = graph.buildD2();
	assertEquals(output, "o: Omega\n");
});

Deno.test("mermaid empty", () => {
	const graph = new Graph();
	const output = graph.buildMermaid();
	assertEquals(output, "graph TD\n\n");
});

Deno.test("mermaid simple link", () => {
	const graph = new Graph();
	graph.addLink("a", "b");
	const output = graph.buildMermaid();
	assertEquals(output, "graph TD\n\ta --> b\n");
});

Deno.test("mermaid simple label", () => {
	const graph = new Graph();
	graph.setLabel("o", "Omega");
	const output = graph.buildMermaid();
	assertEquals(output, 'graph TD\n\to["Omega"]\n');
});
