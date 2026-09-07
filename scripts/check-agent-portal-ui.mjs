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
  await page.locator('.custom-height input').first().fill('Agent')
  await page.locator('input[type=password]').fill('123456')
  const s = await page.locator('.drag_verify').boundingBox(),
    h = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width - 2, h.y + h.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.waitForURL(/agent/)
  await page.goto('http://127.0.0.1:3017/ggapp/#/agent/merchants')
  await page.locator('.agent-partners').waitFor()
  await page.locator('.el-table__row').first().waitFor()
  assert.equal(await page.getByText('全球策略總代理', { exact: true }).count(), 0)
  const indirect = page.locator('.el-table__row').filter({ hasText: '間接下級' })
  assert.ok((await indirect.count()) > 0)
  assert.equal(await indirect.getByRole('button', { name: '修改費率' }).count(), 0)
  await page.getByRole('tab', { name: /^商戶/ }).click()
  const editable = page
    .locator('.el-table__row')
    .filter({ has: page.getByRole('button', { name: '修改費率' }) })
    .first()
  await editable.getByRole('button', { name: '修改費率' }).click()
  const dialog = page.getByRole('dialog')
  const inputs = dialog.locator('input')
  assert.equal(await inputs.nth(1).inputValue(), '')
  await inputs.nth(0).fill('5.500001')
  await inputs.nth(1).fill('2026-09-08')
  await inputs.nth(1).press('Enter')
  await dialog.getByRole('button', { name: '儲存新版本' }).click()
  await dialog.getByText(/費率不得高於上級/).waitFor()
  await inputs.nth(0).fill('5.5')
  await dialog.getByRole('button', { name: '儲存新版本' }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('ggap-agent-rate-versions-v1') || '[]').length === 1
  )
  const version = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ggap-agent-rate-versions-v1'))[0]
  )
  assert.equal(version.rate, '5.5')
  assert.equal(version.actorId, 'A00001')
  assert.equal(version.effectiveFrom, '2026-09-08')
  assert.equal('editable' in version, false)
  await page.reload()
  await page.locator('.agent-partners').waitFor()
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ggap-agent-rate-versions-v1')).length
    ),
    1
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const widths = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    view: innerWidth
  }))
  assert.ok(widths.page <= widths.view, JSON.stringify(widths))
  const state = await page.context().storageState()
  for (const origin of state.origins)
    origin.localStorage = origin.localStorage.filter((item) =>
      /^ggap-(agent-rate-versions|agent-contracts|merchant-contracts|business-merchants|.*reconciliation-summaries)-v1$/.test(
        item.name
      )
    )
  const adminContext = await browser.newContext({
    storageState: state,
    viewport: { width: 1440, height: 1000 }
  })
  const admin = await adminContext.newPage()
  admin.on('pageerror', (e) => errors.push(e.message))
  await admin.goto('http://127.0.0.1:3017/ggapp/')
  await admin.locator('.dv_handler').waitFor()
  const slider = await admin.locator('.drag_verify').boundingBox(),
    handle = await admin.locator('.dv_handler').boundingBox()
  await admin.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await admin.mouse.down()
  await admin.mouse.move(slider.x + slider.width - 2, handle.y + handle.height / 2, { steps: 25 })
  await admin.mouse.up()
  await admin.getByRole('button', { name: '登入', exact: true }).click()
  await admin.locator('.ggap-sections').waitFor()
  await admin.goto(`http://127.0.0.1:3017/ggapp/#/business/merchants/${version.id}`)
  await admin.getByRole('tab', { name: '商務條件', exact: true }).click()
  const sharedRow = admin.locator('.el-table__row').filter({ hasText: '代理 A00001 調整費率' })
  await sharedRow.waitFor()
  assert.ok((await sharedRow.innerText()).includes('5.5%'))
  assert.ok((await sharedRow.innerText()).includes('2026-09-08'))
  assert.equal(await sharedRow.getByRole('button', { name: '設為生效' }).count(), 0)
  await admin.reload()
  await admin.getByRole('tab', { name: '商務條件', exact: true }).click()
  await admin.locator('.el-table__row').filter({ hasText: '代理 A00001 調整費率' }).waitFor()
  await adminContext.close()
  assert.deepEqual(errors, [])
  console.log(
    'Agent portal UI passed: agent login, indirect read-only, cap rejection/equality, effective-date persistence, mobile width, shared admin contract history after reload, no runtime errors'
  )
} finally {
  await browser.close()
}
