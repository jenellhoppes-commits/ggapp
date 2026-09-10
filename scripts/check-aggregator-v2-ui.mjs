import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(15000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
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
  const open = async (route) => {
    await page.goto(`http://127.0.0.1:3017/ggapp/#/${route}`)
  }
  await open('business/merchants/M00001?tab=games')
  await page.getByRole('tab', { name: '遊戲配置', exact: true }).waitFor()
  await page.getByRole('tab', { name: '遊戲配置', exact: true }).click()
  await page.getByText('聚合平台不設定 RTP。', { exact: false }).waitFor()
  assert.equal(await page.getByText('核定 RTP 方案', { exact: true }).count(), 0)
  await page
    .getByRole('button', { name: /線路設定/ })
    .first()
    .click()
  await page.getByRole('tab', { name: '遊戲與路由', exact: true }).waitFor()
  await page.getByRole('tab', { name: '遊戲與路由', exact: true }).click()
  await page.getByText('供應商接入', { exact: true }).waitFor()
  await open('members/management/P00001?tab=jackpots')
  await page.getByRole('tab', { name: '基本資料', exact: true }).waitFor()
  assert.equal(await page.getByRole('tab', { name: '獎池紀錄', exact: true }).count(), 0)
  await open('transactions/bets')
  await page.getByRole('button', { name: '查看', exact: true }).first().waitFor()
  assert.equal(await page.getByRole('button', { name: '查看盤面', exact: true }).count(), 0)
  await page.getByRole('button', { name: '查看', exact: true }).first().click()
  await page.getByRole('tab', { name: '基本資料', exact: true }).waitFor()
  assert.equal(await page.getByRole('tab', { name: '結果重播', exact: true }).count(), 0)
  assert.equal(await page.getByRole('tab', { name: '遊戲盤面', exact: true }).count(), 0)
  await open('trials/links')
  await page.getByRole('button', { name: '建立試玩連結', exact: true }).click()
  await page.getByText('綁定商戶（選填）', { exact: true }).waitFor()
  await page.getByText('試玩金額', { exact: true }).waitFor()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    assert.ok(await page.getByText('試玩金額', { exact: true }).isVisible())
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"][aria-label="建立單遊戲試玩連結"]')
      const box = dialog?.getBoundingClientRect()
      return box && box.x >= -1 && box.right <= window.innerWidth + 1
    })
    const drawer = await page
      .getByRole('dialog', { name: '建立單遊戲試玩連結', exact: true })
      .boundingBox()
    assert.ok(drawer.x >= -1 && drawer.x + drawer.width <= width + 1)
  }
  assert.deepEqual(errors, [])
  console.log(
    'Aggregator V2 UI checks passed: RTP removal, per-line entry, no jackpot/replay tabs, merchant-optional trial amount and responsive drawer.'
  )
} finally {
  await browser.close()
}
