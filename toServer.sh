#!/usr/bin/env bash
set -eux

deno bundle \
	--minify \
	--output=public/logic.js \
	--sourcemap \
	source/web.ts

rsync \
	--checksum \
	--delay-updates \
	--delete-delay \
	--exclude=.DS_Store \
	--perms \
	--recursive \
	--verbose \
	public/ xmas2014.3t0.de:/var/www/wikidata-graph-game.edjopato.de/
