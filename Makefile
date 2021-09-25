e2e:
	${HOME}/.deno/bin/deno test --allow-net --location https://host/ e2e_tests

example-app:
	${HOME}/.deno/bin/deno run --allow-net example/server.ts

format-check:
	${HOME}/.deno/bin/deno fmt --check reno example e2e_tests

format:
	${HOME}/.deno/bin/deno fmt reno example e2e_tests

lint:
	${HOME}/.deno/bin/deno lint reno example e2e_tests

test:
	${HOME}/.deno/bin/deno test reno example

install-types:
	mkdir -p types
	${HOME}/.deno/bin/deno types > types/deno.d.ts

generate-readme:
	${HOME}/.deno/bin/deno run --allow-read --allow-write tools/generate_readme.ts
