e2e:
	deno test --allow-net --location https://host/ e2e_tests

example-app:
	deno run --allow-net example/server.ts

format-check:
	deno fmt --check reno example e2e_tests

format:
	deno fmt reno example e2e_tests

lint:
	deno lint --unstable reno example e2e_tests

test:
	deno test reno example