import { assert, assertEquals, assertMatch } from "https://deno.land/std/assert/mod.ts";

const root = new URL("../../", import.meta.url);

async function read(path: string): Promise<string> {
  return await Deno.readTextFile(new URL(path, root));
}

async function copyContractFixture(destination: string): Promise<void> {
  for (const path of [
    "README.md",
    "package.json",
    "frontend/package.json",
    "scripts/config.sh",
    "scripts/validate-runtime-contract.sh",
    ".github/workflows/build-and-push.yml",
    "docs/architecture.md",
    "backend/src/config/index.ts",
  ]) {
    const target = `${destination}/${path}`;
    await Deno.mkdir(target.substring(0, target.lastIndexOf("/")), { recursive: true });
    await Deno.copyFile(new URL(`../../${path}`, import.meta.url), target);
  }
  await Deno.chmod(`${destination}/scripts/validate-runtime-contract.sh`, 0o755);
}

async function runChecker(rootPath: string, pathEnv?: string): Promise<Deno.CommandOutput> {
  return await new Deno.Command("/usr/bin/bash", {
    args: [`${rootPath}/scripts/validate-runtime-contract.sh`],
    env: pathEnv === undefined ? undefined : { PATH: pathEnv },
    stdout: "piped",
    stderr: "piped",
  }).output();
}

Deno.test("runtime contract: README uses executable frontend commands", async () => {
  const readme = await read("README.md");
  const frontend = JSON.parse(await read("frontend/package.json"));
  assertMatch(readme, /cd frontend[\s\S]{0,120}npm run dev/);
  assert(frontend.scripts.dev, "frontend/package.json must define scripts.dev");
  assert(!/npm run start/.test(readme), "README must not advertise a missing root start script");
});

Deno.test("runtime contract: documented versions and ports match repository sources", async () => {
  const readme = await read("README.md");
  const architecture = await read("docs/architecture.md");
  const frontend = JSON.parse(await read("frontend/package.json"));
  const rootPackage = JSON.parse(await read("package.json"));
  const workflow = await read(".github/workflows/build-and-push.yml");
  const config = await read("scripts/config.sh");

  assertMatch(readme, new RegExp(`React\\s*\\|\\s*${frontend.dependencies.react.replace("^", "")}`));
  assertMatch(readme, new RegExp(`Playwright\\s*\\|[^\\n]*${rootPackage.devDependencies["@playwright/test"]}`));
  assertMatch(architecture, new RegExp(`Playwright\\s*\\|[^\\n]*${rootPackage.devDependencies["@playwright/test"]}`));
  assertMatch(readme, /DENO_PORT.*3333/);
  assertMatch(readme, /localhost:5173/);
  assertMatch(readme, /8080:8080/);
  assertMatch(readme, /3333:3333/);
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

Deno.test("runtime contract: checker passes a consistent repository", async () => {
  const output = await runChecker(new URL("../../", import.meta.url).pathname.replace(/\/$/, ""));
  assertEquals(output.code, 0);
  assertMatch(new TextDecoder().decode(output.stdout), /OK: runtime contract is consistent/);
});

Deno.test("runtime contract: checker reports actionable drift", async () => {
  const fixture = await Deno.makeTempDir({ prefix: "lapdev-runtime-contract-" });
  await copyContractFixture(fixture);
  const readmePath = `${fixture}/README.md`;
  const readme = await Deno.readTextFile(readmePath);
  await Deno.writeTextFile(readmePath, readme.replace("React | 19.2.0", "React | 18.2.0"));

  const output = await runChecker(fixture);
  assertEquals(output.code, 1);
  assertMatch(new TextDecoder().decode(output.stderr), /DRIFT: React version documentation/);
});

Deno.test("runtime contract: checker separates environment limitations", async () => {
  const fixture = await Deno.makeTempDir({ prefix: "lapdev-runtime-contract-" });
  await copyContractFixture(fixture);
  const output = await runChecker(fixture, fixture);
  assertEquals(output.code, 2);
  assertMatch(new TextDecoder().decode(output.stderr), /ENVIRONMENT:/);
});
