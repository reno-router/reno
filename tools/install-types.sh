#!/usr/bin/env sh

if [ -d types ]; then
  rm -rf types
fi

echo "Installing type definitions..."

mkdir types
deno types > types/deno.d.ts
curl https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/949922e0959ccea0cad7a6fa787b63b7d4e67d3f/types/sinon/index.d.ts > types/sinon.d.ts