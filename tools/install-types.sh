#!/usr/bin/env sh

if [ -d types ]; then
  rm -rf types
fi

echo "Installing type definitions..."

mkdir types
deno types > types/deno.d.ts
