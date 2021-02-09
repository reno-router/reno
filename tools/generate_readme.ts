#!/usr/bin/env deno

import { parse as parseTOML } from "https://deno.land/std@0.86.0/encoding/toml.ts";

interface Metadata {
  name: string;
  description: string;
  version: string;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function readFileAsString(filename: string) {
  return decoder.decode(Deno.readFileSync(filename));
}

function writeStringToFile(filename: string, contents: string) {
  return Deno.writeFileSync(filename, encoder.encode(contents));
}

const { version } = parseTOML(readFileAsString("Package.toml")) as Record<keyof Metadata, string>;
const readmeTemplate = readFileAsString("README.template.md");

const updatedReadme = readmeTemplate
  .replace(/\{\{version\}\}/g, version);

writeStringToFile("README.md", updatedReadme);
