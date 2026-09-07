import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(
  pathToFileURL(path.join(process.argv[2], 'playwright/index.mjs')).href
)
const output = path.resolve('docs/qa/browser-ui', process.argv[3] || 'after')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(10000)
const errors = []
const results = []
page.on('pageerror', (error) => errors.push(error.message))
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
  await page.waitForTimeout(600)
  console.log('LOGIN', page.url())
  await page.screenshot({ path: path.join(output, '01-dashboard.png'), fullPage: true })
  assert.equal(await page.locator('.context-bar').count(), 0)
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.locator('.setting-box-wrap').nth(2).locator('.setting-item').nth(1).click()
  await page.waitForTimeout(500)
  const palette = await page
    .locator('.ggap-sections .function-link:not(.active)')
    .first()
    .evaluate((el) => ({
      text: getComputedStyle(el).color,
      background: getComputedStyle(el.closest('.menu-left')).backgroundColor
    }))
  assert.equal(palette.text, 'rgb(186, 187, 189)')
  assert.equal(palette.background, 'rgb(25, 26, 35)')
  results.push({ test: 'light page + dark menu', palette })
  await page.screenshot({ path: path.join(output, '02-dark-menu.png'), fullPage: true })
  await page.locator('.setting-box-wrap').nth(0).locator('.setting-item').nth(1).click()
  await page.waitForTimeout(700)
  assert.ok(await page.locator('html').evaluate((el) => el.classList.contains('dark')))
  await page.screenshot({ path: path.join(output, '03-dark-page.png'), fullPage: true })
  results.push({ test: 'dark page switch', passed: true })
  await page.locator('.setting-box-wrap').nth(0).locator('.setting-item').nth(0).click()
  await page.locator('.drawer-con > div:first-child .c-p').click()
  await page.waitForTimeout(600)
  await page.locator('#main-navigation-toggle').click()
  assert.ok(
    await page.locator('.ggap-sections').evaluate((el) => el.classList.contains('collapsed'))
  )
  await page.locator('#main-navigation-toggle').click()
  await page
    .locator('.ggap-sections')
    .getByRole('link', { name: '供應商對帳', exact: true })
    .click()
  await page.locator('.art-table .el-table__body-wrapper tbody tr').first().waitFor()
  await page.locator('#art-table-header .button').nth(2).click()
  for (const label of ['斑馬紋', '邊框', '表頭背景']) {
    const checkbox = page.getByRole('checkbox', { name: label, exact: true })
    if (!(await checkbox.isChecked()))
      await page.locator('.el-checkbox:visible').filter({ hasText: label }).click()
    assert.ok(await checkbox.isChecked())
  }
  assert.ok(
    await page
      .locator('.art-table .el-table')
      .evaluate(
        (el) =>
          el.classList.contains('el-table--border') && el.classList.contains('el-table--striped')
      )
  )
  await page.locator('h1').click()
  await page.locator('#art-table-header .button').nth(1).click()
  await page.getByRole('menuitem', { name: '緊湊', exact: true }).click()
  await page.locator('h1').click()
  await page.waitForTimeout(250)
  assert.ok(
    await page
      .locator('.art-table .el-table')
      .evaluate((el) => el.classList.contains('el-table--small'))
  )
  assert.equal(await page.locator('.el-pagination').count(), 1)
  await page.screenshot({ path: path.join(output, '04-table-preferences.png'), fullPage: true })
  results.push({ test: 'table preferences, density and single pagination', passed: true })
  const rowOne = await page.locator('.el-table__body-wrapper tbody tr').first().innerText()
  await page.locator('.el-pagination .btn-next').click()
  assert.notEqual(
    await page.locator('.el-table__body-wrapper tbody tr').first().innerText(),
    rowOne
  )
  await page.locator('.el-pagination .btn-prev').click()
  assert.equal(await page.locator('.el-table__body-wrapper tbody tr').first().innerText(), rowOne)
  results.push({ test: 'pagination changes visible records', passed: true })
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '匯出 CSV', exact: true }).click()
  const download = await downloadEvent
  await download.saveAs(path.join(output, 'reconciliation.csv'))
  results.push({ test: 'real CSV download', filename: download.suggestedFilename() })
  await page.getByPlaceholder('供應商、代碼或對帳編號').fill('NO-SUCH-RECORD-TEST')
  await page.getByRole('button', { name: '查詢', exact: true }).click()
  await page.locator('.el-empty').waitFor()
  await page.screenshot({ path: path.join(output, '05-empty-table.png'), fullPage: true })
  results.push({ test: 'empty filter state', passed: true })
  await page.getByRole('button', { name: '重置', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(output, '06-mobile-table.png'), fullPage: true })
  results.push({
    test: 'mobile page overflow',
    dimensions: await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth
    }))
  })
  const fixedWidths = await page
    .locator('.el-table__header-wrapper th')
    .evaluateAll((items) =>
      items
        .filter((el) => el.className.includes('fixed-column'))
        .map((el) => ({ text: el.textContent, width: el.getBoundingClientRect().width }))
    )
  console.log('MOBILE FIXED', fixedWidths)
  assert.equal(fixedWidths.length, 0, 'No pinned columns should obscure narrow table')
  const tableScroll = page.locator('.art-table .el-scrollbar__wrap')
  await tableScroll.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
  })
  await page.waitForTimeout(200)
  await page.screenshot({
    path: path.join(output, '06b-mobile-table-scrolled.png'),
    fullPage: true
  })
  assert.ok(await tableScroll.evaluate((el) => el.scrollLeft > 0))
  await page.locator('#main-navigation-toggle').click()
  await page.getByRole('button', { name: '關閉選單' }).waitFor()
  const focusable = page.locator('.ggap-sections').locator('button:visible, a:visible')
  await focusable.last().focus()
  await page.keyboard.press('Tab')
  assert.ok(await focusable.first().evaluate((el) => el === document.activeElement))
  await page.keyboard.press('Shift+Tab')
  assert.ok(await focusable.last().evaluate((el) => el === document.activeElement))
  await page.screenshot({ path: path.join(output, '07-mobile-menu.png'), fullPage: true })
  await page.keyboard.press('Escape')
  console.log(
    'ESCAPE FOCUS',
    await page.evaluate(() => ({
      focus: document.activeElement?.outerHTML,
      expanded: document.querySelector('#main-navigation-toggle')?.getAttribute('aria-expanded')
    }))
  )
  await page.waitForTimeout(300)
  assert.equal(await page.locator('#main-navigation-toggle').getAttribute('aria-expanded'), 'false')
  assert.ok(
    await page.locator('#main-navigation-toggle').evaluate((el) => el === document.activeElement)
  )
  results.push({ test: 'mobile menu focus wrap and Escape', passed: true })
  await page.goto('http://127.0.0.1:3017/ggapp/#/dashboard')
  await page.locator('h1').waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(output, '08-mobile-dashboard.png'), fullPage: true })
  results.push({
    test: 'mobile dashboard overflow',
    dimensions: await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth
    }))
  })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  const buttonGap = await page
    .locator('.filter-actions .el-form-item__content')
    .evaluate((el) => getComputedStyle(el).columnGap)
  assert.equal(buttonGap, '8px')
  await page.goto('http://127.0.0.1:3017/ggapp/#/platform/access/accounts')
  await page.locator('.art-table .el-table').waitFor()
  assert.ok(
    await page
      .locator('.art-table .el-table')
      .evaluate(
        (el) =>
          el.classList.contains('el-table--small') &&
          el.classList.contains('el-table--border') &&
          el.classList.contains('el-table--striped')
      )
  )
  results.push({ test: 'table preferences persist across pages', passed: true })
  assert.equal(errors.length, 0, 'No uncaught page errors')
  console.log(JSON.stringify({ errors, results }, null, 2))
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ errors, results }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
  results.push({ test: 'interrupted', error: error.message })
  throw error
} finally {
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ errors, results }, null, 2))
  await browser.close()
}
