/**
 * Report and explicitly migrate legacy BMAD artifacts.
 *
 * The default mode is read-only. Migration copies into the current BMAD tree,
 * preserves relative paths, and refuses to overwrite different content.
 */
type Entry = { source: string; destination: string; status: "pending" | "migrated" | "conflict" };

function option(name: string, fallback: string): string {
  const index = Deno.args.indexOf(name);
  return index === -1 ? fallback : Deno.args[index + 1] ?? fallback;
}

const root = option("--root", Deno.cwd());
const migrate = Deno.args.includes("--migrate");
const sourceRoot = `${root}/implementation_artifacts`;
const destinationRoot = `${root}/_agile-output/implementation-artifacts/legacy-migrated`;

async function digest(path: string): Promise<string> {
  const data = await Deno.readFile(path);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function files(dir: string, prefix = ""): Promise<string[]> {
  const result: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) result.push(...await files(path, relative));
    else if (entry.isFile) result.push(relative);
  }
  return result.sort();
}

const entries: Entry[] = [];
try {
  for (const relative of await files(sourceRoot)) {
    const source = `${sourceRoot}/${relative}`;
    const destination = `${destinationRoot}/${relative}`;
    let status: Entry["status"] = "pending";
    try {
      if ((await digest(source)) === (await digest(destination))) status = "migrated";
      else status = "conflict";
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    if (status === "pending" && migrate) {
      await Deno.mkdir(destination.substring(0, destination.lastIndexOf("/")), { recursive: true });
      await Deno.copyFile(source, destination);
      status = "migrated";
    }
    entries.push({ source: relative, destination: relative, status });
  }
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
}

const hasConflict = entries.some((entry) => entry.status === "conflict");
console.log(JSON.stringify({
  currentStatus: "_agile-output/implementation-artifacts/sprint-status.yaml",
  currentRoot: "_agile-output",
  legacyRoot: "implementation_artifacts",
  destinationRoot: "_agile-output/implementation-artifacts/legacy-migrated",
  mode: migrate ? "migrate" : "report",
  entries,
}, null, 2));
Deno.exit(hasConflict ? 2 : 0);
