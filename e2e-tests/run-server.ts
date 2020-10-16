import * as cp from "child_process";
import * as path from "path";
import * as os from "os";

type TestSuiteGlobal = NodeJS.Global & {
  serverProc: cp.ChildProcess;
};

const testSuiteGlobal = global as unknown as TestSuiteGlobal;

export function runServer() {
  return new Promise((resolve, reject) => {
    if (!testSuiteGlobal.serverProc) {
      testSuiteGlobal.serverProc = cp.spawn(
        // The full path is required for Travis CI
        `${os.homedir()}/.deno/bin/deno`,
        ["run", "--allow-net", "example/server.ts"],
        {
          cwd: path.resolve(__dirname, ".."),
        },
      );

      testSuiteGlobal.serverProc.stdout.on("data", (data: Buffer) => {
        if (data.toString().includes("Listening for requests on :8000...")) {
          resolve();
        }
      });

      testSuiteGlobal.serverProc.stderr.pipe(process.stderr);
      testSuiteGlobal.serverProc.on("error", reject);

      return;
    }

    resolve();
  });
}

export function killServer() {
  testSuiteGlobal.serverProc?.kill();
}
