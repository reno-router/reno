/* Right now, Deno doesn't support dynamic
 * ESM imports which would be required to
 * write a runner compatible with its
 * in-built testing module. There are
 * discussions to introduce a runner once
 * import() is supported in the runtime.
 *
 * https://github.com/denoland/deno/issues/1789
 * https://github.com/denoland/deno_std/issues/193
 *
 * TODO: use the provided runner once it lands
 *
 * Also note the _test prefix for test files. This
 * is following the official style guide:
 * https://deno.land/style_guide.html#eachmoduleshouldcomewithtests
 */

import { runTests } from 'https://deno.land/std@v0.7/testing/mod.ts';
import './src/router_test.ts';
import './src/json_test.ts';
import './src/cookies_test.ts';

(async () => {
  await runTests({ parallel: true });
})();
