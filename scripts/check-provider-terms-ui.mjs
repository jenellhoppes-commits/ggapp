import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const output = path.resolve('docs/qa/provider-terms')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
try {
  await page.clock.setFixedTime(new Date('2026-09-07T04:00:00Z'))
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
  await page.goto('http://127.0.0.1:3017/ggapp/#/admin/providers')
  await page.getByRole('button', { name: '查看詳情', exact: true }).first().click()
  await page.getByRole('tab', { name: '成本與結算', exact: true }).click()
  const terms = page.locator('.provider-terms')
  await terms.getByText('待設定：尚未填寫合約費率與結算條件').waitFor()
  await terms.getByRole('button', { name: '新增條件', exact: true }).click()
  const form = page.locator('.terms-form')
  await form.getByRole('button', { name: '儲存新版本', exact: true }).click()
  await form.getByRole('alert').waitFor()
  await form.getByPlaceholder('請手動輸入，不預設為 0').fill('12.5')
  await form
    .locator('.el-select')
    .filter({ has: page.getByRole('combobox', { name: '結算幣別', exact: true }) })
    .click()
  await page.getByRole('option', { name: 'TWD', exact: true }).click()
  const date = form.getByPlaceholder('每次新增版本皆須指定日期')
  await date.fill('2026-09-07')
  await date.press('Tab')
  await form.screenshot({ path: path.join(output, 'first-form.png') })
  await form.getByRole('button', { name: '儲存新版本', exact: true }).click()
  await form.waitFor({ state: 'hidden' })
  assert.match(await terms.innerText(), /V1/)
  await terms.getByRole('button', { name: '修改條件', exact: true }).click()
  assert.equal(await date.inputValue(), '')
  assert.equal(await form.getByPlaceholder('請手動輸入，不預設為 0').inputValue(), '12.5')
  await form.getByPlaceholder('請手動輸入，不預設為 0').fill('15')
  await form.getByRole('button', { name: '儲存新版本', exact: true }).click()
  await form.getByRole('alert').waitFor()
  await date.fill('2026-10-01')
  await date.press('Tab')
  await form.getByRole('button', { name: '儲存新版本', exact: true }).click()
  await form.waitFor({ state: 'hidden' })
  assert.equal(await terms.locator('.terms-version').count(), 2)
  assert.match(await terms.innerText(), /生效中/)
  assert.match(await terms.innerText(), /待生效/)
  await terms.screenshot({ path: path.join(output, 'versions-desktop.png') })
  await page.reload()
  await terms.locator('.terms-version').first().waitFor()
  assert.equal(await terms.locator('.terms-version').count(), 2)
  await page.setViewportSize({ width: 390, height: 844 })
  await terms.screenshot({ path: path.join(output, 'versions-mobile.png') })
  await terms.getByRole('button', { name: '修改條件', exact: true }).click()
  await form.getByPlaceholder('請手動輸入，不預設為 0').fill('99')
  await form.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '繼續編輯', exact: true }).click()
  assert.equal(await form.getByPlaceholder('請手動輸入，不預設為 0').inputValue(), '99')
  await form.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '放棄變更', exact: true }).click()
  await form.waitFor({ state: 'hidden' })
  assert.equal(await terms.locator('.terms-version').count(), 2)
  assert.equal(errors.length, 0)
  await writeFile(
    path.join(output, 'results.json'),
    JSON.stringify(
      {
        passed: true,
        errors,
        checks: [
          'empty state',
          'validation',
          'first save',
          'new effective date required',
          'append version',
          'current/pending status',
          'reload persistence',
          'mobile',
          'discard guard'
        ]
      },
      null,
      2
    )
  )
  console.log('Provider terms browser flow passed')
} finally {
  await browser.close()
}
