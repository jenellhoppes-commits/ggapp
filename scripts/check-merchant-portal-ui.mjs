import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://127.0.0.1:3017/ggapp/')
  await page.locator('.dv_handler').waitFor()
  await page.locator('.custom-height input').first().fill('Merchant')
  await page.locator('input[type=password]').fill('123456')
  const s = await page.locator('.drag_verify').boundingBox(),
    h = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width - 2, h.y + h.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.waitForURL(/merchant/)
  for (const route of ['bets', 'transactions', 'members']) {
    await page.goto(`http://127.0.0.1:3017/ggapp/#/merchant/${route}`)
    await page.locator('.merchant-query').waitFor()
    await page
      .getByRole('heading', {
        name: { bets: '注單查詢', transactions: '交易流水', members: '會員與錢包' }[route],
        exact: true
      })
      .waitFor()
    await page.locator('.el-table__row').first().waitFor()
    assert.equal(await page.getByRole('button', { name: /修改|匯出|補單|調整餘額/ }).count(), 0)
    const key = await page.locator('.el-table__row').first().locator('td').first().innerText()
    await page.getByPlaceholder('識別碼、會員、遊戲或事件').fill(key)
    await page.getByRole('button', { name: '查詢', exact: true }).click()
    await page.waitForURL(/q=/)
    await page.reload()
    await page.locator('.merchant-query').waitFor()
    assert.equal(await page.getByPlaceholder('識別碼、會員、遊戲或事件').inputValue(), key)
    await page.getByPlaceholder('識別碼、會員、遊戲或事件').fill('foreign-no-match')
    await page.getByRole('button', { name: '查詢', exact: true }).click()
    await page.getByText('符合條件 0 筆', { exact: false }).waitFor()
    await page.getByRole('button', { name: '重置', exact: true }).click()
    await page.waitForURL((url) => !url.hash.includes('q='))
    await page.locator('.el-table__row').first().waitFor()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(200)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  assert.deepEqual(errors, [])
  console.log(
    'Merchant UI: three scoped read-only pages, query persistence, empty/reset states, mobile width, no runtime errors passed'
  )
} finally {
  await browser.close()
}
