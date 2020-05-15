#!/usr/bin/env deno

/* Here be dragons. Awful, hacky dragons.
 * Rudimentary TOML parsing? ✅
 * Creating Git tags via fs operations? ✅
 * Don't touch this unless you know what you're doing */

interface Metadata {
  name: string;
  description: string;
  version: string;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const readFileAsString = (filename: string) =>
  decoder.decode(Deno.readFileSync(filename));

const writeStringToFile = (filename: string, contents: string) =>
  Deno.writeFileSync(filename, encoder.encode(contents));

const sanitiseTOMLToken = (token: string) => token.trim().replace(/"/g, "");

// TODO: use an actual TOML parser!
const parseTOML = <TResult>(toml: string) =>
  Object.fromEntries(
    toml.split("\n")
      .map((entry) =>
        entry.split("=")
          .map((token) => sanitiseTOMLToken(token))
      ),
  ) as TResult;

const tagRelease = (version: string) => {
  const head = readFileAsString(".git/refs/heads/master");
  writeStringToFile(`.git/refs/tags/v${version}`, head);
};

const { version } = parseTOML<Metadata>(readFileAsString("Package.toml"));
const readmeTemplate = readFileAsString("README.template.md");
const logoSvg = readFileAsString("logo/reno.svg");

const updatedReadme = readmeTemplate
  .replace(/\{\{version\}\}/g, version);

writeStringToFile("README.md", updatedReadme);
// TODO: commit post-README
tagRelease(version);
