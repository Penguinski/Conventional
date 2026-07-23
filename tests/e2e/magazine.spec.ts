import { expect, test } from "@playwright/test";
import { dailyWord } from "../../src/games/five-letters/logic";
import { solutionCells } from "../../src/games/crossword/logic";

test("home keeps a two-column mobile grid and opens all cards", async ({ page }, testInfo) => {
  await page.goto("/");
  const cards = page.locator(".issue-card");
  await expect(cards).toHaveCount(17);
  const columns = await page.locator(".card-grid").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "desktop" ? 4 : 2);
  for (let index = 0; index < 12; index += 1) {
    const card = page.locator(".issue-card").filter({ has: page.locator(`.corner-tab:text-is("N. ${String(index + 1).padStart(2, "0")}")`) });
    await card.click();
    await expect(page.locator(".game-sheet")).toBeVisible();
    await page.getByRole("button", { name: /INDIETRO/ }).click();
  }
});

test("shared URL and browser back restore the magazine", async ({ page }) => {
  await page.goto("/?gioco=intruso");
  await expect(page.getByRole("heading", { name: "Trova l’intruso" })).toBeVisible();
  await page.goBack();
  await expect(page.locator(".card-grid")).toBeVisible();
});

test("camera experiences have complete demo fallbacks", async ({ page }) => {
  for (const id of ["fondo-tazza", "piede"]) {
    await page.goto(`/?gioco=${id}`);
    await page.getByRole("button", { name: "MODALITÀ DEMO" }).click();
    await expect(page.locator(".result-panel")).toBeVisible();
  }
});

test("one complete flow for every game updates 12/12 and survives reload", async ({ page }) => {
  await page.goto("/");

  await page.goto("/?gioco=fuori-traccia");
  const maze = page.locator("canvas[aria-label^='Labirinto']");
  const mazeBox = await maze.boundingBox();
  if (!mazeBox) throw new Error("Maze canvas unavailable");
  await page.mouse.move(mazeBox.x + 12, mazeBox.y + 12);
  await page.mouse.down();
  await page.mouse.move(mazeBox.x + mazeBox.width - 12, mazeBox.y + mazeBox.height - 12, { steps: 24 });
  await page.mouse.up();

  await page.goto("/?gioco=intruso");
  await page.getByRole("button", { name: /scarpe pulite/ }).click();

  await page.goto("/?gioco=cassetto");
  for (const label of ["elastico", "batteria", "scontrino", "matita"]) await page.getByRole("button", { name: label, exact: true }).click();
  const target = ["biglietto", "lista", "chiave"][new Date().getDate() % 3];
  await page.getByRole("button", { name: target, exact: true }).click();

  await page.goto("/?gioco=collega-punti");
  for (let point = 1; point <= 15; point += 1) await page.getByRole("button", { name: `Punto ${point}` }).click();

  await page.goto("/?gioco=polvere");
  const dust = page.locator("canvas[aria-label^='Superficie']");
  const dustBox = await dust.boundingBox();
  if (!dustBox) throw new Error("Dust canvas unavailable");
  await page.mouse.move(dustBox.x + 30, dustBox.y + 30);
  await page.mouse.down();
  await page.mouse.move(dustBox.x + 180, dustBox.y + 180, { steps: 12 });
  await page.mouse.up();
  await page.getByRole("button", { name: "FINITO" }).click();

  await page.goto("/?gioco=prima-dopo");
  for (const hotspot of await page.locator(".diff").all()) await hotspot.click();

  await page.goto("/?gioco=caso-piatti");
  for (const clue of ["Padella", "Lavello", "Messaggio"]) await page.getByRole("button", { name: new RegExp(clue) }).click();
  await page.getByRole("button", { name: /Marta/ }).click();

  await page.goto("/?gioco=cinque-tracce");
  await page.keyboard.type(dailyWord());
  await page.keyboard.press("Enter");

  await page.goto("/?gioco=cruciverba");
  for (const [key, letter] of solutionCells()) {
    const [row, col] = key.split("-").map(Number);
    await page.getByLabel(`Casella ${row + 1}, ${col + 1}`).fill(letter);
  }

  await page.goto("/?gioco=scontrino");
  for (let answer = 0; answer < 6; answer += 1) await page.locator(".quiz-question button").first().click();

  for (const id of ["fondo-tazza", "piede"]) {
    await page.goto(`/?gioco=${id}`);
    await page.getByRole("button", { name: "MODALITÀ DEMO" }).click();
  }

  await page.goto("/");
  await expect(page.locator(".issue-counter")).toHaveText("12/12");
  await page.reload();
  await expect(page.locator(".issue-counter")).toHaveText("12/12");
});

test("no horizontal overflow at the target viewport", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
