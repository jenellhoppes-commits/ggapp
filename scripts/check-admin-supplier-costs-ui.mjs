import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
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
  for (const route of ['agents/create', 'merchants/create', 'agents/A00001', 'merchants/M00001']) {
    const tab = route.endsWith('create') ? '' : route.startsWith('agents/') ? '?tab=terms' : '?tab=commercial'
    await page.goto(`http://127.0.0.1:3017/ggapp/#/business/${route}${tab}`)
    await page.reload()
    if (!route.endsWith('create')) {
      await page.locator(route.startsWith('agents/') ? '.agent-detail-page' : '.merchant-detail').waitFor()
      await page.getByRole('tab', { name: '商務條件', exact: true }).waitFor()
    }
    await page.locator('.supplier-costs').waitFor()
    assert.ok(await page.getByText('供應商銷售條件', { exact: true }).isVisible())
    if (!route.endsWith('create')) {
      assert.equal(await page.locator('.tabs-card .supplier-costs').count(), 1)
      assert.equal(await page.locator('.supplier-costs').count(), 1)
      assert.equal(await page.getByRole('button', { name: '舊版新增已停用' }).count(), 0)
      const summary = await page.locator('.summary-grid').boundingBox()
      const panel = await page.locator('.supplier-costs').boundingBox()
      assert.ok(panel.y > summary.y + summary.height)
      await page.waitForFunction(
        () =>
          document.querySelector('.supplier-costs .el-table')?.getBoundingClientRect().height < 280,
        null,
        { timeout: 3000 }
      )
    }
    for (const label of ['計費基礎', '結算幣別', '結算週期']) {
      const item = page
        .locator('.cost-form .el-form-item')
        .filter({
          has: page.locator('.el-form-item__label').filter({ hasText: new RegExp(`^${label}$`) })
        })
      assert.equal(await item.getByRole('combobox').isDisabled(), true)
    }
  }
  await page.locator('.supplier-costs').getByRole('button', { name: '保存新版本' }).click()
  await page.locator('.supplier-costs .el-alert--error').waitFor()
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ggap-admin-supplier-costs-v1') || '[]').length
    ),
    0
  )
  assert.deepEqual(errors, [])
  console.log(
    'Admin supplier cost UI passed: create/detail panels, invalid save blocked, no runtime errors.'
  )
} finally {
  await browser.close()
}
