// Stands in for the marketplace API during the publish rehearsal. Takes one
// upload from `zebar publish`, checks the form and the tarball the CLI built,
// and exits non-zero if a real release would go out wrong. The real API's own
// validation isn't public, so these checks only cover what the pack controls.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buffer } from "node:stream/consumers";

const PORT = 8787;
const MAX_TARBALL_BYTES = 3_000_000;
const MAX_PREVIEW_IMAGES = 6;
/** Besides each widget's page and the preview images that zpack.json names. */
const REQUIRED_FILES = ["zpack.json", "config.json", "README.md", "LICENSE"];

async function listTarball(tarball: File) {
  const dir = mkdtempSync(join(tmpdir(), "publish-stub-"));
  const path = join(dir, "pack.tar.gz");
  writeFileSync(path, Buffer.from(await tarball.arrayBuffer()));
  return execFileSync("tar", ["-tzf", path], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

async function findProblems(token: unknown, form: FormData) {
  const { env } = process;
  const problems: string[] = [];
  const expect = (name: string, actual: unknown, expected: unknown) => {
    if (actual !== expected) {
      problems.push(
        `${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  };

  expect("token", token, env.ZEBAR_PUBLISH_TOKEN);
  expect("versionOverride", form.get("versionOverride"), env.VERSION);
  expect("releaseNotes", form.get("releaseNotes"), env.RELEASE_NOTES);
  expect("releaseUrl", form.get("releaseUrl"), env.RELEASE_URL);
  if (!form.get("commitSha")) problems.push("commitSha is missing");

  const tarball = form.get("tarball") as File;
  if (tarball.size > MAX_TARBALL_BYTES) {
    problems.push(`tarball is ${tarball.size} bytes`);
  }

  const packConfig = form.get("packConfig") as File;
  const { previewImages = [], widgets = [] } = JSON.parse(
    await packConfig.text()
  ) as {
    previewImages?: string[];
    widgets?: { htmlPath: string }[];
  };
  const pages = widgets.map(({ htmlPath }) => htmlPath.replace(/^\.\//, ""));
  if (pages.length === 0) problems.push("no widgets");
  if (previewImages.length < 1 || previewImages.length > MAX_PREVIEW_IMAGES) {
    problems.push(`${previewImages.length} preview images`);
  }

  const files = await listTarball(tarball);
  console.log(`Tarball: ${tarball.size} bytes, ${files.length} files`);
  for (const file of [...REQUIRED_FILES, ...pages, ...previewImages]) {
    if (!files.includes(file)) problems.push(`${file} is not in the tarball`);
  }

  return problems;
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  const body = new Response(await buffer(req), {
    headers: { "content-type": req.headers["content-type"] ?? "" }
  });
  const problems = await findProblems(
    req.headers["x-api-token"],
    await body.formData()
  );

  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
  }

  const widgetPack = {
    publishedId: "rehearsal",
    latestVersion: process.env.VERSION
  };
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify(
      problems.length > 0
        ? { error: { json: { message: problems.join("; ") } } }
        : { result: { data: { json: { widgetPack } } } }
    )
  );
  server.close();
}

const server = createServer((req, res) => {
  if (req.url === "/v1/trpc/widgetPack.publishVersion") {
    void handleUpload(req, res);
  } else {
    res.writeHead(404).end();
  }
});

server.listen(PORT, "127.0.0.1");
