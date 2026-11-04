import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../dist", import.meta.url));
const server = createServer(async (req, res) => {
  const path = req.url.split("?")[0];
  const file = path.startsWith("/assets/") ? path : "/index.html";
  try {
    const data = await readFile(root + file);
    res.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const options = Object.fromEntries(
  [
    "beings",
    "gods",
    "mortals",
    "places",
    "materials",
    "powers",
    "curses",
    "oracles",
    "prophecies",
    "artifactTypes",
    "alignments",
    "monsterCategories",
  ].map((k) => [k, []]),
);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let optionCalls = 0,
    posts = 0;
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let status = 200,
      body = {};
    if (path === "/api/options") {
      optionCalls++;
      if (optionCalls === 2) {
        status = 503;
        body = { message: "Falha simulada" };
      } else body = options;
    } else if (path === "/api/beings" && route.request().method() === "POST") {
      posts++;
      status = 201;
      body = { id: 9000 };
    } else throw new Error("Unexpected API request: " + path);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto(base + "/#/register/beings");
  await page.getByLabel("Nome", { exact: true }).fill("Cadastro preservado");
  await page.getByLabel("Categoria", { exact: true }).selectOption("Mortal");
  await page.getByLabel("Estado vital").selectOption("Vivo");
  await page
    .getByRole("button", { name: "Cadastrar ser", exact: false })
    .click();
  const saved = page.getByRole("heading", {
    name: "Cadastro preservado agora faz parte do acervo.",
  });
  await saved.waitFor();
  await page.getByRole("button", { name: "Atualizar seletores" }).waitFor();
  assert.equal(await saved.isVisible(), true);
  assert.equal(posts, 1);
  await page.getByRole("button", { name: "Atualizar seletores" }).click();
  await page
    .getByRole("button", { name: "Atualizar seletores" })
    .waitFor({ state: "hidden" });
  assert.equal(await saved.isVisible(), true);
  assert.equal(posts, 1);
  assert.equal(optionCalls, 3);
  assert.deepEqual(pageErrors, []);
  await page.close();
  const initial = await browser.newPage();
  let initialCalls = 0;
  await initial.route("**/api/**", async (route) => {
    initialCalls++;
    await route.fulfill({
      status: initialCalls === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        initialCalls === 1 ? { message: "Falha inicial" } : options,
      ),
    });
  });
  await initial.goto(base + "/#/register/beings");
  await initial.getByRole("alert").getByText("Falha inicial").waitFor();
  await initial.getByRole("button", { name: "Tentar novamente" }).click();
  await initial.getByLabel("Nome", { exact: true }).waitFor();
  console.log(
    "PASS: completed registration survives failed refresh; retry recovers without another POST; initial failure still recovers. All API responses mocked; no database accessed.",
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
