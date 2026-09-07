import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  })
  await page.goto('http://127.0.0.1:3017/ggapp/')
  await page.locator('.dv_handler').waitFor()
  const inspect = () =>
    page.evaluate(() => ({
      touch: getComputedStyle(document.documentElement).touchAction,
      scale: visualViewport.scale,
      small: [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')]
        .filter(
          (e) =>
            e.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(e).fontSize) < 16
        )
        .map((e) => e.className),
      width: document.documentElement.scrollWidth,
      viewport: innerWidth
    }))
  assert.deepEqual((await inspect()).small, [])
  assert.equal((await inspect()).touch, 'manipulation')
  const s = await page.locator('.drag_verify').boundingBox(),
    h = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width - 2, h.y + h.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.locator('.ggap-sections').waitFor()
  for (const route of ['/dashboard', '/business/reports', '/admin/providers']) {
    await page.goto(`http://127.0.0.1:3017/ggapp/#${route}`)
    await page.locator('form').first().waitFor()
    await page.waitForTimeout(500)
    const input = page.locator('form input:visible').first()
    await input.tap()
    const result = await inspect()
    assert.equal(result.scale, 1)
    assert.deepEqual(result.small, [])
    console.log(JSON.stringify({ route, ...result }))
  }
  console.log(
    'Mobile touch and input focus checks passed (Chrome emulation; iOS device confirmation still needed)'
  )
} finally {
  await browser.close()
}
