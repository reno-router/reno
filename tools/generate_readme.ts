#!/usr/bin/env deno

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

const metadata: Metadata = JSON.parse(readFileAsString("egg.json"));
const readmeTemplate = readFileAsString("README.template.md");
const updatedReadme = readmeTemplate
  .replace(/\{\{version\}\}/g, metadata.version);

writeStringToFile("README.md", updatedReadme);
