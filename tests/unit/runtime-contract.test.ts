import { assert, assertMatch } from "https://deno.land/std/assert/mod.ts";

const root = new URL("../../", import.meta.url);

async function read(path: string): Promise<string> {
  return await Deno.readTextFile(new URL(path, root));
}

Deno.test("runtime contract: README uses executable frontend commands", async () => {
  const readme = await read("README.md");
  assertMatch(readme, /cd frontend[\s\S]{0,120}npm run dev/);
  assert(!/npm run start/.test(readme), "README must not advertise a missing root start script");
});

Deno.test("runtime contract: documented versions and ports match repository sources", async () => {
  const readme = await read("README.md");
  const frontend = JSON.parse(await read("frontend/package.json"));
  const workflow = await read(".github/workflows/build-and-push.yml");
  const config = await read("scripts/config.sh");

  assertMatch(readme, new RegExp(`React\\s*\\|\\s*${frontend.dependencies.react.replace("^", "")}`));
  assertMatch(readme, new RegExp(`Playwright\\s*\\|[^\\n]*1\\.60\\.0`));
  assertMatch(readme, /DENO_PORT.*3333/);
  assertMatch(config, /BACKEND_PORT=\$\{BACKEND_PORT:-3333\}/);
  assertMatch(workflow, /DENO_VERSION:\s*2\.8\.2/);
});

Deno.test("runtime contract: current BMAD output root is documented", async () => {
  const readme = await read("README.md");
  const agents = await read("AGENTS.md");
  assertMatch(agents, /_agile-output/);
  assertMatch(agents, /\.agents\/skills/);
  assert(readme.includes("_agile-output") || agents.includes("_agile-output"));
});

Deno.test("runtime contract: drift checker reports actionable mismatches", async () => {
  const checker = await read("scripts/validate-runtime-contract.sh");
  assertMatch(checker, /DRIFT/);
});

Deno.test("runtime contract: drift checker separates environment limitations", async () => {
  const checker = await read("scripts/validate-runtime-contract.sh");
  assertMatch(checker, /ENVIRONMENT/);
});
