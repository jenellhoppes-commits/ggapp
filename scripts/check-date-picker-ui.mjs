import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const output = path.resolve('docs/qa/date-picker', process.argv[3] || 'after')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  timezoneId: 'America/New_York'
})
const results = [],
  errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.setDefaultTimeout(8000)
const values = () =>
  page
    .locator('.app-filter-form .el-range-input')
    .evaluateAll((inputs) => inputs.map((i) => i.value))
const urlDates = () => {
  const q = new URLSearchParams(page.url().split('?')[1])
  return [q.get('from'), q.get('to')]
}
try {
  await page.clock.setFixedTime(new Date('2026-09-06T16:30:00Z'))
  await page.goto('http://127.0.0.1:3017/ggapp/')
  await page.locator('.dv_handler').waitFor()
  const s = await page.locator('.drag_verify').boundingBox(),
    h = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width - 2, h.y + h.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.locator('.ggap-sections').waitFor()
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 568],
    [844, 390]
  ]) {
    await page.setViewportSize({ width, height })
    for (const [name, route] of [
      ['dashboard', '/dashboard'],
      ['reports', '/business/reports']
    ]) {
      try {
        await page.goto(
          `http://127.0.0.1:3017/ggapp/#${route}?from=2026-08-31&to=2026-08-31&currency=TWD`
        )
        const form = page.locator('.app-filter-form'),
          inputs = form.locator('.el-range-input')
        await inputs.first().waitFor()
        await page.waitForTimeout(700)
        await inputs.first().click()
        const panel = page.locator('.el-date-range-picker:visible')
        await panel.waitFor()
        await page.waitForTimeout(300)
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`) })
        const bounds = (await page.locator('.report-date-picker:visible').count())
          ? await page.locator('.report-date-picker:visible').boundingBox()
          : await panel.boundingBox()
        assert.ok(
          bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
          `calendar horizontal bounds ${JSON.stringify(bounds)}`
        )
        assert.ok(
          bounds.y >= -1 && bounds.y + bounds.height <= height + 1,
          `calendar vertical bounds ${JSON.stringify(bounds)}`
        )
        const initial = page.url()
        const expected = [
          ['2026-09-07', '2026-09-07'],
          ['2026-09-06', '2026-09-06'],
          ['2026-09-07', '2026-09-07'],
          ['2026-08-31', '2026-09-06'],
          ['2026-09-01', '2026-09-07'],
          ['2026-08-01', '2026-08-31']
        ]
        for (const [i, label] of ['本日', '昨日', '本週', '上週', '本月', '上月'].entries()) {
          if (i) await inputs.first().click()
          await panel.getByRole('button', { name: label, exact: true }).click()
          assert.deepEqual(await values(), expected[i])
          assert.equal(page.url(), initial)
        }
        // Pick a valid historical range through the calendar, not model injection.
        await inputs.first().click()
        const left = panel.locator('.el-date-range-picker__content.is-left')
        await left.locator('td.available').filter({ hasText: /^30$/ }).click()
        await left.locator('td.available').filter({ hasText: /^31$/ }).click()
        assert.deepEqual(await values(), ['2026-08-30', '2026-08-31'])
        assert.equal(page.url(), initial)
        await inputs.first().click()
        await left.locator('td.available').filter({ hasText: /^31$/ }).click()
        await panel
          .locator('.el-date-range-picker__content.is-right td.available')
          .filter({ hasText: /^1$/ })
          .click()
        assert.deepEqual(
          await values(),
          ['2026-08-31', '2026-09-01'],
          'Cross-month selection reaches second calendar'
        )
        // Typing a range must follow the same draft/submit contract.
        await inputs.first().fill('2026-08-30')
        await inputs.first().press('Tab')
        await inputs.last().fill('2026-08-31')
        await inputs.last().press('Tab')
        await page.keyboard.press('Escape')
        assert.deepEqual(await values(), ['2026-08-30', '2026-08-31'])
        assert.equal(page.url(), initial)
        await form.getByRole('button', { name: '查詢', exact: true }).click()
        await page.waitForTimeout(500)
        assert.deepEqual(urlDates(), await values())
        assert.deepEqual(urlDates(), ['2026-08-30', '2026-08-31'])
        await form.getByRole('button', { name: '重置', exact: true }).click()
        await page.waitForTimeout(500)
        assert.deepEqual(urlDates(), await values())
        assert.deepEqual(
          urlDates(),
          name === 'dashboard' ? ['2026-08-31', '2026-08-31'] : ['2026-09-07', '2026-09-07']
        )
        // Same-page URL navigation must refresh both draft dates and applied data.
        await page.goto(
          `http://127.0.0.1:3017/ggapp/#${route}?from=2026-08-29&to=2026-08-30&currency=TWD`
        )
        await page.waitForTimeout(500)
        assert.deepEqual(
          await values(),
          ['2026-08-29', '2026-08-30'],
          'URL navigation synchronizes fields'
        )
        await page.reload()
        await inputs.first().waitFor()
        assert.deepEqual(urlDates(), await values(), 'Reload preserves query dates')
        await inputs.first().click()
        await page.keyboard.press('Escape')
        await panel.waitFor({ state: 'hidden' })
        results.push({ name, width, height, passed: true, bounds })
      } catch (e) {
        results.push({ name, width, height, passed: false, error: e.message })
      }
      console.log(JSON.stringify(results.at(-1)))
    }
  }
  console.log(JSON.stringify({ results, errors }, null, 2))
  assert.equal(errors.length, 0)
  assert.ok(results.every((r) => r.passed))
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2))
  await browser.close()
}
