import { test, expect } from "@playwright/test";

test("B1 - lecture, pause et reprise", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/index.html");
  const toggle = page.locator(".zydka-player-toggle-button");
  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());

  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(true);

  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(false);
  const paused = await state();
  expect(paused.status).toBe("paused");

  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(true);
  await expect.poll(async () => (await state()).position).toBeGreaterThan(paused.position);

  const resumed = await state();
  expect(resumed.status).toBe("playing");
  expect(resumed.error).toBeNull();
});

test("B1 - piste suivante et precedente", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");
  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  await expect.poll(async () => (await state()).queue.length).toBe(2);
  const buttons = page.locator(".zydka-player-nav-button");
  await buttons.last().click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-2");
  expect((await state()).currentIndex).toBe(1);
  await buttons.first().click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");
  expect((await state()).currentIndex).toBe(0);
});

test("B2 - deplacement de la timeline a 5 secondes", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/index.html");
  const toggle = page.locator(".zydka-player-toggle-button");
  const progress = page.locator(".zydka-player-progress");
  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());

  await toggle.click();
  await expect.poll(async () => Number(await progress.getAttribute("max"))).toBeGreaterThan(0);
  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(false);

  await progress.fill("5");
  await expect.poll(async () => (await state()).position).toBeGreaterThanOrEqual(4.8);
  expect((await state()).position).toBeLessThanOrEqual(5.2);
});

test("B2 - navigation clavier Home et fleche droite", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/index.html");
  const toggle = page.locator(".zydka-player-toggle-button");
  const progress = page.locator(".zydka-player-progress");
  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());

  await toggle.click();
  await expect.poll(async () => Number(await progress.getAttribute("max"))).toBeGreaterThan(0);
  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(false);

  await progress.focus();
  await progress.press("Home");
  await expect.poll(async () => (await state()).position).toBeLessThanOrEqual(0.2);
  await progress.press("ArrowRight");
  await expect.poll(async () => (await state()).position).toBeGreaterThanOrEqual(4.8);
  expect((await state()).position).toBeLessThanOrEqual(5.2);

  await progress.press("Home");
  await expect.poll(async () => (await state()).position).toBeLessThanOrEqual(0.2);
});

test("B2 - deplacement tactile de la timeline", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:8765/e2e/fixtures/index.html");

    const toggle = page.locator(".zydka-player-toggle-button");
    const progress = page.locator(".zydka-player-progress");
    const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());

    await toggle.tap();
    await expect.poll(async () => Number(await progress.getAttribute("max"))).toBeGreaterThan(0);

    await toggle.tap();
    await expect.poll(async () => (await state()).isPlaying).toBe(false);

    await progress.scrollIntoViewIfNeeded();
    const bounds = await progress.boundingBox();
    expect(bounds).not.toBeNull();

    await page.touchscreen.tap(
      bounds!.x + bounds!.width / 2,
      bounds!.y + bounds!.height / 2,
    );

    await expect.poll(async () => (await state()).position).toBeGreaterThan(3.5);
    expect((await state()).position).toBeLessThan(6.5);
  } finally {
    await context.close();
  }
});

test("B3 - cycle des modes de repetition", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");

  const repeat = page.locator(".zydka-player-repeat-button");

  await expect(repeat).toHaveAttribute("data-repeat-mode", "off");
  await expect(repeat).toHaveAttribute("aria-pressed", "false");

  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "queue");
  await expect(repeat).toHaveAttribute("aria-pressed", "true");

  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "one");
  await expect(repeat).toHaveAttribute("aria-pressed", "true");

  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "off");
  await expect(repeat).toHaveAttribute("aria-pressed", "false");
});


test("B3 - activation et desactivation du shuffle", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");

  const shuffle = page.locator(".zydka-player-shuffle-button");

  await expect(shuffle).toHaveAttribute("aria-pressed", "false");

  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "true");
  await expect(shuffle).toHaveClass(/zydka-player-mode-button--active/);

  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "false");
  await expect(shuffle).not.toHaveClass(/zydka-player-mode-button--active/);
});

test("B3 - fin de playlist et repetition queue", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");

  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  const next = page.locator(".zydka-player-nav-button").last();
  const repeat = page.locator(".zydka-player-repeat-button");

  await expect.poll(async () => (await state()).queue.length).toBe(2);

  await expect(next).toBeEnabled();
  await next.click();
  await expect.poll(async () => (await state()).currentIndex).toBe(1);
  await expect(next).toBeDisabled();

  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "queue");
  await expect(next).toBeEnabled();

  await next.click();
  await expect.poll(async () => (await state()).currentIndex).toBe(0);
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");
});

test("B3 - repetition naturelle du morceau en mode one", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");

  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  const repeat = page.locator(".zydka-player-repeat-button");
  const toggle = page.locator(".zydka-player-toggle-button");
  const progress = page.locator(".zydka-player-progress");

  await repeat.click();
  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "one");

  await toggle.click();
  await expect.poll(async () => (await state()).isPlaying).toBe(true);
  await expect.poll(async () => Number(await progress.getAttribute("max"))).toBeGreaterThan(0);

  await progress.fill("9");
  await expect.poll(async () => (await state()).position).toBeGreaterThanOrEqual(8.5);

  await expect.poll(async () => {
    const current = await state();
    return current.currentTrack?.id === "e2e-track-1"
      && current.isPlaying
      && current.position < 3;
  }, { timeout: 8000, intervals: [100] }).toBe(true);
});


test("B3 - historique precedent en mode shuffle", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist.html");

  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  const shuffle = page.locator(".zydka-player-shuffle-button");
  const buttons = page.locator(".zydka-player-nav-button");
  const previous = buttons.first();
  const next = buttons.last();

  await expect.poll(async () => (await state()).queue.length).toBe(2);
  await page.locator(".zydka-player-toggle-button").click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");

  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "true");

  await next.click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-2");

  await previous.click();
  await page.locator(".zydka-player-toggle-button").click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");
  expect((await state()).currentIndex).toBe(0);
});

test("B3 - shuffle trois pistes sans repetition prematuree", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist-three.html");

  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  const shuffle = page.locator(".zydka-player-shuffle-button");
  const buttons = page.locator(".zydka-player-nav-button");
  const previous = buttons.first();
  const next = buttons.last();

  await expect.poll(async () => (await state()).queue.length).toBe(3);
  await page.locator(".zydka-player-toggle-button").click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");

  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "true");

  const visited = ["e2e-track-1"];

  for (let step = 0; step < 2; step++) {
    const before = (await state()).currentTrack?.id;
    await next.click();
    await expect.poll(async () => (await state()).currentTrack?.id).not.toBe(before);
    visited.push((await state()).currentTrack.id);
  }

  expect(new Set(visited).size).toBe(3);

  await previous.click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe(visited[1]);
});

test("B3 - nouveau cycle shuffle avec repeat queue", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/e2e/fixtures/playlist-three.html");

  const state = () => page.evaluate(() => (window as any).ZydkaPlayer.state());
  const next = page.locator(".zydka-player-nav-button").last();
  const shuffle = page.locator(".zydka-player-shuffle-button");
  const repeat = page.locator(".zydka-player-repeat-button");

  await expect.poll(async () => (await state()).queue.length).toBe(3);
  await page.locator(".zydka-player-toggle-button").click();
  await expect.poll(async () => (await state()).currentTrack?.id).toBe("e2e-track-1");

  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "true");

  await repeat.click();
  await expect(repeat).toHaveAttribute("data-repeat-mode", "queue");

  const visited = new Set(["e2e-track-1"]);

  for (let i = 0; i < 2; i++) {
    const before = (await state()).currentTrack?.id;
    await next.click();
    await expect.poll(async () => (await state()).currentTrack?.id).not.toBe(before);
    visited.add((await state()).currentTrack.id);
  }

  expect(visited.size).toBe(3);

  const lastTrack = (await state()).currentTrack.id;
  await expect(next).toBeEnabled();
  await next.click();

  await expect.poll(async () => (await state()).currentTrack?.id).not.toBe(lastTrack);
  expect(visited.has((await state()).currentTrack.id)).toBe(true);
});
