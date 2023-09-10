import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { Graph } from "./graph.ts";

Deno.test("empty", () => {
	const graph = new Graph();
	const output = graph.build();
	assertEquals(output, "\n");
});

Deno.test("simple link", () => {
	const graph = new Graph();
	graph.addLink("a", "b");
	const output = graph.build();
	assertEquals(output, "a -> b\n");
});

Deno.test("simple label", () => {
	const graph = new Graph();
	graph.setLabel("o", "Omega");
	const output = graph.build();
	assertEquals(output, "o: Omega\n");
});
