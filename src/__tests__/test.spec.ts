import { expect, Page, test } from "@playwright/test";

test("0(レッツゴー陰陽師)", async ({ page }) => {
  await compare(page, 0, 20);
});

test("7(to the beginning)", async ({ page }) => {
  await compare(page, 7, 60);
});

test("8(満天)", async ({ page }) => {
  await compare(page, 8, 50);
  await compare(page, 8, 80);
  await compare(page, 8, 90);
});

test("9(うっせぇわ)", async ({ page }) => {
  await compare(page, 9, 70);
});

test("11(アンインストール)", async ({ page }) => {
  await compare(page, 11, 55);
  await compare(page, 11, 90);
});

test("15(残響散歌)", async ({ page }) => {
  await compare(page, 15, 50);
  await compare(page, 15, 90);
  await compare(page, 15, 105);
});

test("22(ヨワイボクラハウタウ)", async ({ page }) => {
  await compare(page, 22, 140);
});

const compare = async (page: Page, video: number, time: number) => {
  await page.goto(
    `http://localhost:3000/docs/sample/index.html?novideo=1&time=${time}&video=${video}`
  );
  await page.waitForSelector("div.loaded", { state: "attached" });
  await expect(page).toHaveScreenshot(`${video}-${time}.png`);
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
    `${video}-${time}.png`,
    { threshold: 0.075 }
  );
};
