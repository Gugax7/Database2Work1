import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

// Read-only by default. Write scenarios are opt-in and must target a disposable local backend.
const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const local = ["localhost", "127.0.0.1"].includes(new URL(base).hostname);
const writes = process.env.E2E_WRITES === "local-test-database";
if (writes && !local)
  throw new Error("Write tests only support a disposable localhost backend.");
const browser = await chromium.launch({ headless: true });
const screenshots = process.env.E2E_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
let checks = 0;
const errors = [];
async function visible(locator) {
  await locator.waitFor({ state: "visible" });
  checks++;
}
async function noOverflow(page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Horizontal overflow",
  );
  checks++;
}
try {
  for (const viewport of [
    { width: 1440, height: 1100 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await visible(page.getByRole("heading", { name: /Todo mito tem/ }));
    const summary = await (
      await page.request.get(`${base}/api/summary`)
    ).json();
    assert.equal(typeof summary.beings, "number");
    await visible(
      page
        .getByLabel("O acervo em números")
        .getByText(String(summary.beings), { exact: true }),
    );
    await noOverflow(page);
    if (screenshots)
      await page.screenshot({
        path: `${screenshots}/home-${viewport.width}.png`,
        fullPage: true,
      });

    await page.goto(`${base}/#/beings`);
    await page.getByLabel("Categoria", { exact: true }).selectOption("Monstro");
    await page.getByLabel("Papel adicional").selectOption("villain");
    await page
      .getByLabel("Poder", { exact: true })
      .selectOption({ label: "Petrificação" });
    await page.getByLabel("Perigo mínimo").fill("9");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await visible(page.getByRole("heading", { name: "1 registro encontrado" }));
    await page.locator(".record-card").filter({ hasText: "Medusa" }).click();
    await visible(page.getByRole("heading", { name: "Medusa", exact: true }));
    await visible(
      page.getByRole("heading", { name: "Petrificação", exact: true }),
    );
    await visible(page.getByRole("heading", { name: "Olhar da Medusa" }));
    await noOverflow(page);
    if (screenshots)
      await page.screenshot({
        path: `${screenshots}/being-${viewport.width}.png`,
        fullPage: true,
      });

    await page.goto(
      `${base}/#/beings?category=Semideus&divineParentId=1&role=hero`,
    );
    await visible(page.getByRole("heading", { name: "Hércules", exact: true }));
    await page.locator(".record-card").filter({ hasText: "Hércules" }).click();
    await visible(page.getByRole("heading", { name: "Ascendência" }));
    await visible(page.getByRole("link", { name: "Alcmena" }));

    await page.goto(
      `${base}/#/adventures?beingId=12&localId=10&yearFrom=-1300&yearTo=-1200&oracleId=1&prophecyState=Cumprida`,
    );
    await visible(page.getByRole("heading", { name: "1 registro encontrado" }));
    await page.locator(".record-card").click();
    await visible(
      page.getByRole("heading", { name: "A Busca da Cabeça da Medusa" }),
    );
    await visible(page.getByRole("heading", { name: "Profecias & oráculos" }));
    await noOverflow(page);

    await page.goto(
      `${base}/#/artifacts?materialId=1&forgerId=18&type=Arma%20Divina&cursed=false`,
    );
    await visible(
      page.getByRole("heading", { name: "2 registros encontrados" }),
    );
    await page
      .locator(".record-card")
      .filter({ hasText: "Raio Mestre" })
      .click();
    await visible(page.getByRole("heading", { name: "Registros de forja" }));
    await visible(page.getByRole("link", { name: "Hefesto" }));
    await noOverflow(page);

    await page.goto(`${base}/#/beings?q=sem-resultados-mythos`);
    await visible(
      page.getByRole("heading", { name: "Nenhum registro nesta busca" }),
    );
    await page.goto(`${base}/#/beings/99999999`);
    await visible(
      page.getByRole("alert").getByText("Registro não encontrado."),
    );
    await page.goto(`${base}/#/beings/58`);
    await visible(
      page.getByText("Nenhum vínculo cadastrado.", { exact: true }).first(),
    );

    await page.goto(`${base}/#/beings`);
    await page.getByLabel("Categoria", { exact: true }).selectOption("Deus");
    await page.getByLabel("Buscar por nome").fill("Zeus");
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    assert.equal(
      await page.getByLabel("Categoria", { exact: true }).inputValue(),
      "",
    );
    assert.equal(await page.getByLabel("Buscar por nome").inputValue(), "");
    checks += 2;

    await page.route("**/api/beings?*", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Banco temporariamente indisponível.",
        }),
      }),
    );
    await page.goto(`${base}/#/beings?q=falha-controlada`);
    await visible(
      page.getByRole("alert").getByText("Banco temporariamente indisponível."),
    );
    await page.unroute("**/api/beings?*");
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await visible(
      page.getByRole("heading", { name: "Nenhum registro nesta busca" }),
    );
    for (const resource of ["beings", "adventures", "artifacts"]) {
      await page.goto(`${base}/#/register/${resource}`);
      await visible(
        page.getByRole("heading", { name: "Informações principais" }),
      );
      await noOverflow(page);
    }
    if (screenshots)
      await page.screenshot({
        path: `${screenshots}/register-${viewport.width}.png`,
        fullPage: true,
      });

    if (writes) {
      const suffix = `${Date.now()}-${viewport.width}`;
      await page.goto(`${base}/#/register/beings`);
      await page
        .getByLabel("Nome", { exact: true })
        .fill(`Mortal E2E ${suffix}`);
      await page
        .getByLabel("Categoria", { exact: true })
        .selectOption("Mortal");
      await page.getByLabel("Estado vital").selectOption("Vivo");
      await page.getByLabel("Ocupação").fill("Explorador");
      await page.getByLabel("Também é herói").check();
      await page.getByLabel("Motivação do herói").fill("Descobrir histórias");
      const power = page.locator(".link-editor").filter({
        has: page.getByRole("heading", { name: "Poderes", exact: true }),
      });
      await power.getByRole("button", { name: "Adicionar" }).click();
      await power
        .getByLabel("Poderes 1", { exact: true })
        .selectOption({ label: "Raio Divino" });
      await power.getByLabel("Nível de domínio").fill("5");
      await page
        .getByRole("button", { name: "Cadastrar ser", exact: false })
        .click();
      await visible(
        page.getByRole("heading", {
          name: `Mortal E2E ${suffix} agora faz parte do acervo.`,
        }),
      );
      await page.getByRole("link", { name: "Abrir ficha" }).click();
      await visible(
        page.getByRole("heading", { name: "Raio Divino", exact: true }),
      );
      const curse = page.locator(".association-panel").filter({
        has: page.getByRole("heading", { name: "Associar uma maldição" }),
      });
      await curse
        .getByLabel("Maldição existente")
        .selectOption({ label: "Toque de Midas" });
      await curse
        .getByRole("button", { name: "Associar", exact: true })
        .click();
      await visible(
        page.getByRole("heading", { name: "Toque de Midas", exact: true }),
      );
      await curse
        .getByLabel("Maldição existente")
        .selectOption({ label: "Toque de Midas" });
      await curse
        .getByRole("button", { name: "Associar", exact: true })
        .click();
      await visible(curse.getByRole("alert"));

      await page.goto(`${base}/#/register/adventures`);
      await page
        .getByLabel("Nome", { exact: true })
        .fill(`Jornada E2E ${suffix}`);
      await page.getByLabel("Ano de início").fill("-1000");
      await page.getByLabel("Status", { exact: true }).selectOption("Pendente");
      await page
        .getByLabel("Local", { exact: true })
        .selectOption({ label: "Atenas" });
      await page.getByLabel("Objetivo da aventura").fill("Explorar o acervo");
      const participants = page.locator(".link-editor").filter({
        has: page.getByRole("heading", {
          name: "Participantes",
          exact: true,
        }),
      });
      await participants.getByRole("button", { name: "Adicionar" }).click();
      await participants
        .getByLabel("Participantes 1", { exact: true })
        .selectOption({ label: "Hércules" });
      await page.getByRole("button", { name: "Cadastrar aventura" }).click();
      await visible(
        page.getByRole("heading", {
          name: `Jornada E2E ${suffix} agora faz parte do acervo.`,
        }),
      );
      await page.getByRole("link", { name: "Abrir ficha" }).click();
      await visible(page.getByRole("link", { name: "Hércules" }));

      await page.goto(`${base}/#/register/artifacts`);
      await page
        .getByLabel("Nome", { exact: true })
        .fill(`Artefato E2E ${suffix}`);
      await page
        .getByLabel("Material principal")
        .selectOption({ label: "Bronze Celestial" });
      await page.getByLabel("Poder especial").fill("Luz");
      const forges = page.locator(".link-editor").filter({
        has: page.getByRole("heading", {
          name: "Registros de forja",
          exact: true,
        }),
      });
      await forges.getByRole("button", { name: "Adicionar" }).click();
      await forges
        .getByLabel("Material 1")
        .selectOption({ label: "Bronze Celestial" });
      await forges.getByLabel("Forjador").selectOption({ label: "Hefesto" });
      await page.getByRole("button", { name: "Cadastrar artefato" }).click();
      await visible(
        page.getByRole("heading", {
          name: `Artefato E2E ${suffix} agora faz parte do acervo.`,
        }),
      );
      await page.getByRole("link", { name: "Abrir ficha" }).click();
      await visible(page.getByRole("link", { name: "Hefesto" }));
    }
    await context.close();
  }
  assert.deepEqual(errors, [], "Unexpected browser errors");
  console.log(
    `${checks} browser checks passed (desktop + mobile; writes ${writes ? "enabled on local test backend" : "disabled"}).`,
  );
} finally {
  await browser.close();
}
