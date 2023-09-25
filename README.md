# Wikidata Graph Game

A minigame to find a Wikidata item based on its category.

## Play the game

Go to <https://wikidata-graph-game.edjopato.de>.

## Run the dev webpage

Start the following two processes (probably in different tabs / shells):

```bash
deno run -A --watch=web.ts bundle.ts

cd public && python -m http.server --bind localhost
```

Then you can open the webpage on <http://localhost:8000>.

## Test locally

Start the following two processes (probably in different tabs / shells):

```bash
deno run -A --watch local.ts
d2 --watch --dark-theme=201 graph.d2
```

Then edit the `local.ts` file to your liking.
