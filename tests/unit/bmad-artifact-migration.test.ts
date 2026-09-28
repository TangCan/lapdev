import { assert, assertEquals } from "jsr:@std/assert@1";

const script = `${Deno.cwd()}/scripts/bmad-artifact-migration.ts`;

async function run(args: string[]) {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "--allow-write", script, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

Deno.test("reports current path and pending legacy files without copying", async () => {
  const root = await Deno.makeTempDir({ prefix: "bmad-migration-" });
  await Deno.mkdir(`${root}/implementation_artifacts`, { recursive: true });
  await Deno.writeTextFile(`${root}/implementation_artifacts/old.md`, "legacy");
  const result = await run(["--root", root]);
  assertEquals(result.code, 0);
  const report = JSON.parse(result.stdout);
  assertEquals(report.currentStatus, "_agile-output/implementation-artifacts/sprint-status.yaml");
  assertEquals(report.entries[0].status, "pending");
  assert(!(await Deno.stat(`${root}/_agile-output/implementation-artifacts/legacy-migrated/old.md`).catch(() => null)));
});

Deno.test("migrates pending files and reports identical files as migrated", async () => {
  const root = await Deno.makeTempDir({ prefix: "bmad-migration-" });
  await Deno.mkdir(`${root}/implementation_artifacts`, { recursive: true });
  await Deno.mkdir(`${root}/_agile-output/implementation-artifacts/legacy-migrated`, { recursive: true });
  await Deno.writeTextFile(`${root}/implementation_artifacts/a.md`, "a");
  await Deno.writeTextFile(`${root}/_agile-output/implementation-artifacts/legacy-migrated/b.md`, "b");
  await Deno.writeTextFile(`${root}/implementation_artifacts/b.md`, "b");
  const result = await run(["--root", root, "--migrate"]);
  assertEquals(result.code, 0);
  const report = JSON.parse(result.stdout);
  assertEquals(report.entries.map((entry: { status: string }) => entry.status), ["migrated", "migrated"]);
  assertEquals(await Deno.readTextFile(`${root}/_agile-output/implementation-artifacts/legacy-migrated/a.md`), "a");
});

Deno.test("refuses a conflicting destination and never overwrites it", async () => {
  const root = await Deno.makeTempDir({ prefix: "bmad-migration-" });
  await Deno.mkdir(`${root}/implementation_artifacts`, { recursive: true });
  await Deno.mkdir(`${root}/_agile-output/implementation-artifacts/legacy-migrated`, { recursive: true });
  await Deno.writeTextFile(`${root}/implementation_artifacts/conflict.md`, "legacy");
  await Deno.writeTextFile(`${root}/_agile-output/implementation-artifacts/legacy-migrated/conflict.md`, "current");
  const result = await run(["--root", root, "--migrate"]);
  assertEquals(result.code, 2);
  assertEquals(JSON.parse(result.stdout).entries[0].status, "conflict");
  assertEquals(await Deno.readTextFile(`${root}/_agile-output/implementation-artifacts/legacy-migrated/conflict.md`), "current");
});

Deno.test("does not partially migrate when any conflict exists", async () => {
  const root = await Deno.makeTempDir({ prefix: "bmad-migration-" });
  await Deno.mkdir(`${root}/implementation_artifacts`, { recursive: true });
  await Deno.mkdir(`${root}/_agile-output/implementation-artifacts/legacy-migrated`, { recursive: true });
  await Deno.writeTextFile(`${root}/implementation_artifacts/a.md`, "a");
  await Deno.writeTextFile(`${root}/implementation_artifacts/conflict.md`, "legacy");
  await Deno.writeTextFile(`${root}/_agile-output/implementation-artifacts/legacy-migrated/conflict.md`, "current");
  const result = await run(["--root", root, "--migrate"]);
  assertEquals(result.code, 2);
  assert(!(await Deno.stat(`${root}/_agile-output/implementation-artifacts/legacy-migrated/a.md`).catch(() => null)));
});
