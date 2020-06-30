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

function sanitiseTOMLToken(token: string) {
  return token.trim().replace(/"/g, "");
}

function parseTOML<TResult>(toml: string) {
  return Object.fromEntries(
    toml.split("\n")
      .map((entry) =>
        entry.split("=")
          .map((token) => sanitiseTOMLToken(token))
      ),
  ) as TResult;
}

const { version } = parseTOML<Metadata>(readFileAsString("Package.toml"));
const readmeTemplate = readFileAsString("README.template.md");
const logoSvg = readFileAsString("logo/reno.svg");

const updatedReadme = readmeTemplate
  .replace(/\{\{version\}\}/g, version);

writeStringToFile("README.md", updatedReadme);
