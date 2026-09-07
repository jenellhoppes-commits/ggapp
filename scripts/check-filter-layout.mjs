import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const output = path.resolve('docs/qa/filter-layout')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(10000)
const results = [],
  errors = []
page.on('pageerror', (error) => errors.push(error.message))
const cases = [
  ['dashboard', '/dashboard'],
  ['agents', '/business/agents'],
  ['merchants', '/business/merchants'],
  ['bets', '/transactions/bets'],
  ['transactions', '/transactions/records'],
  ['reports', '/business/reports'],
  ['rates', '/platform/exchange-rates'],
  ['reconciliation', '/finance/reconciliation/providers'],
  ['accounts', '/platform/access/accounts'],
  ['languages', '/platform/locales/languages']
]
try {
  await page.goto('http://127.0.0.1:3017/ggapp/')
  await page.locator('.dv_handler').waitFor()
  const slider = await page.locator('.drag_verify').boundingBox()
  const handle = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(slider.x + slider.width - 2, handle.y + handle.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.locator('.ggap-sections').waitFor()
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const [name, route] of cases) {
      try {
        await page.goto(`http://127.0.0.1:3017/ggapp/#${route}`)
        const form = page.locator('.app-filter-form, .art-search-bar').first()
        await form.waitFor()
        await page.waitForTimeout(700)
        const bounds = await form
          .locator('.el-form-item')
          .filter({ has: page.locator('.el-form-item__label') })
          .first()
          .evaluate((el) => {
            const label = el.querySelector('.el-form-item__label').getBoundingClientRect()
            const control = el.querySelector('.el-form-item__content').getBoundingClientRect()
            return {
              label: {
                left: label.left,
                right: label.right,
                top: label.top,
                bottom: label.bottom,
                width: label.width
              },
              control: { left: control.left, top: control.top },
              pageWidth: innerWidth,
              scrollWidth: document.documentElement.scrollWidth
            }
          })
        if (width >= 640) {
          assert.ok(Math.abs(bounds.label.width - 100) < 2, 'desktop label width')
          assert.ok(bounds.label.right <= bounds.control.left + 2, 'desktop side-by-side label')
        } else assert.ok(bounds.label.bottom <= bounds.control.top + 2, 'mobile stacked label')
        assert.ok(bounds.scrollWidth <= bounds.pageWidth + 1, 'page horizontal overflow')
        await form.screenshot({ path: path.join(output, `${name}-${width}.png`) })
        if (width === 1440 && ['dashboard', 'reports'].includes(name)) {
          const initialUrl = page.url()
          for (const label of ['本日', '昨日', '本週', '上週', '本月', '上月']) {
            await form.locator('.el-range-input').first().click()
            const panel = page.locator('.el-date-range-picker:visible')
            await panel.getByRole('button', { name: label, exact: true }).waitFor()
            if (label === '本日')
              await panel.screenshot({ path: path.join(output, `${name}-shortcuts.png`) })
            await panel.getByRole('button', { name: label, exact: true }).click()
            assert.match(
              await form.locator('.el-range-input').first().inputValue(),
              /^\d{4}-\d{2}-\d{2}$/
            )
            assert.equal(page.url(), initialUrl, 'Shortcut must not submit query')
          }
        }
        if (name === 'dashboard') {
          assert.equal(await form.locator('.is-required').count(), 0)
          await form.getByRole('button', { name: /更多條件/ }).click()
          assert.equal(await form.locator('#dashboard-advanced-filters .el-form-item').count(), 2)
          await form.getByRole('button', { name: '查詢', exact: true }).click()
          await page.waitForTimeout(150)
          assert.ok(page.url().includes('currency='))
          await form.getByRole('button', { name: '重置', exact: true }).click()
        }
        results.push({ name, width, passed: true, bounds })
      } catch (error) {
        await page.screenshot({
          path: path.join(output, `${name}-${width}-failure.png`),
          fullPage: true
        })
        results.push({ name, width, passed: false, error: error.message })
      }
    }
  }
  console.log(JSON.stringify({ errors, results }, null, 2))
  assert.equal(errors.length, 0)
  assert.ok(
    results.every((item) => item.passed),
    'Some filter layouts failed'
  )
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ errors, results }, null, 2))
  await browser.close()
}
