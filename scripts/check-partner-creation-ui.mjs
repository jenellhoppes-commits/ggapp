import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const key = 'ggap-partner-workspace-v2'
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(15000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    if (localStorage.getItem('qa-contracts-seeded')) return
    const base = {
      providerId: 'PV00001',
      transactionCurrency: 'USD',
      basis: 'GGR',
      currency: 'USD',
      cycle: 'Monthly',
      effectiveFrom: '2026-01-01',
      meaning: 'payable',
      createdAt: '2026-01-01',
      createdBy: 'QA only',
      timezone: 'Asia/Taipei'
    }
    localStorage.setItem(
      'ggap-admin-supplier-costs-v1',
      JSON.stringify([
        {
          ...base,
          id: 'qa-root',
          owner: 'platform',
          ownerId: 'platform',
          parentId: '',
          rate: '5',
          payable: '5'
        },
        {
          ...base,
          id: 'qa-agent',
          owner: 'agent',
          ownerId: 'A00001',
          parentId: '',
          rate: '6',
          payable: '6',
          upstreamId: 'qa-root',
          upstreamCost: '5'
        }
      ])
    )
    localStorage.setItem('qa-contracts-seeded', 'true')
  })
  await page.goto('http://127.0.0.1:3017/ggapp/')
  await page.locator('.dv_handler').waitFor()
  await page.locator('.custom-height input').first().fill('Agent')
  await page.locator('input[type=password]').fill('123456')
  const slider = await page.locator('.drag_verify').boundingBox(),
    handle = await page.locator('.dv_handler').boundingBox()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(slider.x + slider.width - 2, handle.y + handle.height / 2, { steps: 25 })
  await page.mouse.up()
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await page.waitForURL(/agent/)
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date())
  const field = (area, label) =>
    area.locator('.el-form-item').filter({
      has: page.locator('.el-form-item__label').filter({ hasText: new RegExp(`^${label}$`) })
    })
  async function fill(area, label, value) {
    const input = field(area, label).locator('input, textarea').first()
    await input.fill(value)
    await input.press('Tab')
  }
  async function select(area, label, value) {
    const combo = field(area, label).getByRole('combobox')
    await field(area, label).locator('.el-select__wrapper').click()
    const id = await combo.getAttribute('aria-controls')
    const options = page.locator(`[id="${id}"] [role="option"]`)
    await (value ? options.filter({ hasText: new RegExp(`^${value}$`) }) : options.first()).click()
  }
  async function basic(kind, code) {
    await page.goto(
      `http://127.0.0.1:3017/ggapp/#/agent/${kind === 'agent' ? 'relations' : 'merchants'}/create`
    )
    const area = page.locator('.basic-fields')
    await area.waitFor()
    await fill(area, '代碼', code)
    await fill(area, '名稱', `${code} Demo`)
    await fill(area, '聯絡人', 'QA')
    await fill(area, '聯絡方式', 'demo-only')
    await fill(area, '合作開始日期', today)
    if (kind === 'merchant') {
      await fill(area, '國家／地區', 'TW')
      await fill(area, 'Email', 'qa@example.invalid')
      await select(area, '初始線路幣別', 'USD')
    }
    assert.equal(await field(area, '所屬代理').locator('input').isDisabled(), true)
  }
  async function term() {
    const area = page.locator('.cost-form')
    await select(area, '供應商')
    await select(area, '交易幣別', 'USD')
    await fill(area, '生效日期', today)
    assert.equal(await field(area, '結算幣別').getByRole('combobox').isDisabled(), true)
    await field(area, '結算幣別').getByText('USD', { exact: true }).waitFor()
    await fill(area, '對下級收取 %', '5')
    await area.getByRole('button', { name: '加入待存', exact: true }).click()
    await page
      .locator('.supplier-costs .el-alert--error')
      .filter({ hasText: '低於上游成本' })
      .waitFor()
    await fill(area, '對下級收取 %', '7')
    await area.getByRole('button', { name: '加入待存', exact: true }).click()
    await page.getByText('待主檔保存', { exact: true }).waitFor()
  }
  await basic('agent', 'QA-CHILD')
  await page.getByRole('button', { name: '建立並保存', exact: true }).click()
  await page.locator('.el-alert--error').filter({ hasText: '至少一組' }).waitFor()
  await term()
  await page.evaluate(() => {
    window.qaSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === 'ggap-partner-workspace-v2') throw new Error('QA storage failure')
      return window.qaSetItem.call(this, k, v)
    }
  })
  await page.getByRole('button', { name: '建立並保存', exact: true }).click()
  await page.getByText('QA storage failure', { exact: true }).waitFor()
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), null)
  await page.evaluate(() => {
    Storage.prototype.setItem = window.qaSetItem
  })
  await page.getByRole('button', { name: '建立並保存', exact: true }).click()
  await page.waitForURL(/agent\/relations\?q=/)
  await page.reload()
  await page.getByText('QA-CHILD Demo', { exact: true }).waitFor()
  const first = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
  assert.equal(first.entries.length, 1)
  assert.equal(first.entries[0].agent.level, 'L2')
  assert.equal(first.entries[0].costs[0].payable, '7')
  await basic('merchant', 'QA-MERCHANT')
  await term()
  await page.getByRole('button', { name: '建立並保存', exact: true }).click()
  await page.waitForURL(/agent\/merchants\?q=/)
  await page.reload()
  await page.getByText('QA-MERCHANT Demo', { exact: true }).waitFor()
  const journal = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
  assert.equal(journal.entries.length, 2)
  assert.equal(journal.entries[1].merchant.agentId, 'A00001')
  assert.equal(journal.entries[1].merchant.lines[0].enabledGames, 0)
  await basic('agent', 'QA-MOBILE')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  assert.deepEqual(errors, [])
  console.log(
    'Partner creation UI passed: actor-locked parent, required contracts, cost floor, storage failure/retry, complete agent/merchant save and reload, mobile layout.'
  )
} finally {
  await browser.close()
}
