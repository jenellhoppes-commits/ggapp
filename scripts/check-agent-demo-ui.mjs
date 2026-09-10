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
  const open = async (route, title) => {
    await page.goto(`http://127.0.0.1:3017/ggapp/#/agent/${route}`)
    await page.getByRole('heading', { name: title, exact: true }).waitFor()
  }
  await open('relations', '代理關係')
  const filter = page.locator('.partner-filters')
  const inputBox = await filter.locator('.el-input').first().boundingBox()
  const buttonBox = await filter.getByRole('button', { name: '查詢', exact: true }).boundingBox()
  assert.ok(Math.abs(inputBox.y - buttonBox.y) < 4, 'desktop filters must align')
  await page.getByRole('button', { name: '查看', exact: true }).first().click()
  await page.getByRole('dialog').getByText('基本資料', { exact: true }).waitFor()
  await page.getByRole('dialog').getByText('費率版本', { exact: true }).waitFor()
  assert.equal(await page.getByRole('dialog').getByText('Active', { exact: true }).count(), 0)
  await page.getByRole('dialog').getByRole('button', { name: '關閉', exact: true }).click()
  await open('reports', '代理報表')
  await page.locator('.agent-reports .el-table__row').first().waitFor()
  const reportCount = await page.locator('.agent-reports .el-table__row').count()
  assert.ok(reportCount > 0)
  for (const name of ['代理', '商戶', '遊戲', '幣別']) {
    await page.getByRole('tab', { name, exact: true }).click()
    await page.getByRole('button', { name: '注單明細', exact: true }).first().waitFor()
    await page.getByRole('button', { name: '注單明細', exact: true }).first().click()
    await page.getByRole('dialog').locator('.el-table__row').first().waitFor()
    await page.getByRole('dialog').getByRole('button', { name: '關閉', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
  }
  await open('reports?merchant=outside', '代理報表')
  await page.getByText('暂无数据', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.agent-reports .el-table__row').count(), 0)
  await page.getByRole('button', { name: '重置', exact: true }).click()
  await page.locator('.agent-reports .el-table__row').first().waitFor()
  await page.locator('.el-date-editor input').first().click()
  for (const name of ['本日', '昨日', '本週', '上週', '本月', '上月'])
    await page.getByRole('button', { name, exact: true }).waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  await open('exchange-rates', '匯率報表')
  await page.getByText('公布匯率（1 原幣）', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '修改', exact: true }).count(), 0)
  await open('settlements', '對帳／結算')
  await page.getByRole('button', { name: '查看演示明細' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('textarea').fill('測試跨期費率引用，僅本地草稿')
  await dialog.getByRole('button', { name: '保存本地草稿' }).click()
  await dialog.getByRole('status').waitFor()
  await page.reload()
  await page.getByRole('button', { name: '查看演示明細' }).click()
  assert.equal(
    await page.getByRole('dialog').locator('textarea').inputValue(),
    '測試跨期費率引用，僅本地草稿'
  )
  await page.getByRole('dialog').getByRole('button', { name: '關閉', exact: true }).click()
  await page.getByRole('tab', { name: '我的佣金' }).click()
  await page.getByText('尚無已計算或已確認的佣金紀錄', { exact: true }).waitFor()
  await page.getByRole('tab', { name: '付款紀錄' }).click()
  await page.getByText('目前沒有正式付款紀錄；不以示意金額代替實際付款', { exact: true }).waitFor()
  await open('notifications', '公告通知')
  await page.getByRole('button', { name: '閱讀', exact: true }).first().click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: '關閉', exact: true }).click()
  await page.reload()
  await page
    .locator('.agent-services .el-table__row')
    .first()
    .getByText('已讀', { exact: true })
    .waitFor()
  await page.getByRole('button', { name: '全部標為已讀' }).click()
  assert.ok(await page.getByRole('button', { name: '全部標為已讀' }).isDisabled())
  await open('account', '帳號與權限')
  assert.ok(await page.getByRole('button', { name: '修改密碼（未開放）' }).isDisabled())
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [route, title] of [
    ['dashboard', '儀錶板'],
    ['relations', '代理關係'],
    ['merchants', '商戶管理'],
    ['terms', '商務條件'],
    ['reports', '代理報表'],
    ['exchange-rates', '匯率報表'],
    ['settlements', '對帳／結算'],
    ['notifications', '公告通知'],
    ['account', '帳號與權限']
  ]) {
    await open(route, title)
    await page
      .locator('.slide-left-enter-active, .slide-right-enter-active')
      .waitFor({ state: 'hidden' })
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((e) => {
          const r = e.getBoundingClientRect()
          return r.width && r.left >= 0 && r.right > innerWidth + 2
        })
        .slice(0, 15)
        .map((e) => ({ tag: e.tagName, cls: e.className, width: e.getBoundingClientRect().width }))
    )
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) {
      console.log(
        route,
        overflow,
        await page.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          items: [
            ...document.querySelectorAll(
              '.agent-reports, .agent-reports > *, .agent-services, .agent-services > *'
            )
          ].map((e) => ({
            cls: e.className,
            left: e.getBoundingClientRect().left,
            width: e.getBoundingClientRect().width,
            scroll: e.scrollWidth
          }))
        }))
      )
      await page.screenshot({ path: 'docs/qa/agent-demo-mobile.png', fullPage: true })
    }
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
      `${route}: page overflow`
    )
    await page.screenshot({ path: `docs/qa/agent-demo-${route}-mobile.png`, fullPage: true })
  }
  assert.deepEqual(errors, [])
  console.log(
    'Agent demo UI passed: five pages, report scope/reset, six shortcuts, draft persistence, tabs, read persistence, disabled security and mobile width.'
  )
} finally {
  await browser.close()
}
