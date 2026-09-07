import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { serializeCsv, downloadCsv } from '../src/utils/export/csv'

assert.equal(
  serializeCsv(['欄位'], [['中文,"引號"\n第二行']]),
  '\uFEFF"欄位"\r\n"中文,""引號""\n第二行"'
)
for (const input of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\ttext', '\rtext']) {
  assert.ok(serializeCsv(['值'], [[input]]).includes(`"'${input}"`))
}
assert.equal(
  serializeCsv(['金額', '空值', '啟用'], [[-1.2345, null, false]]),
  '\uFEFF"金額","空值","啟用"\r\n"-1.2345","","false"'
)
assert.equal(serializeCsv(['欄位'], []), '\uFEFF"欄位"')
assert.throws(() => serializeCsv(['欄位'], [[1, 2]]))

// Test the download lifecycle without launching a browser or writing a real file.
let clicked = false
let removed = false
let appended = false
let revoked = ''
let payload: Blob | undefined
const link = {
  href: '',
  download: '',
  click: () => {
    clicked = true
  },
  remove: () => {
    removed = true
  }
}
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL
try {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => link,
      body: {
        appendChild: () => {
          appended = true
        }
      }
    }
  })
  URL.createObjectURL = (blob) => {
    payload = blob as Blob
    return 'blob:test'
  }
  URL.revokeObjectURL = (url) => {
    revoked = url
  }
  downloadCsv('對帳/清單', ['名稱'], [['測試']])
  assert.ok(clicked && removed && appended)
  assert.equal(link.download, '對帳_清單.csv')
  assert.equal(payload?.type, 'text/csv;charset=utf-8')
  assert.ok((await payload!.text()).includes('測試'))
  await new Promise((resolve) => setTimeout(resolve, 1100))
  assert.equal(revoked, 'blob:test')
} finally {
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
  else Reflect.deleteProperty(globalThis, 'document')
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
}
for (const file of ['index', 'differences']) {
  const source = readFileSync(`src/views/game-provider/finance/reconciliation/${file}.vue`, 'utf8')
  assert.match(source, /@click="exportRows"/)
  assert.match(source, /filteredRows\.value\.map/)
  assert.doesNotMatch(source, /已建立匯出工作|差異明細已匯出/)
}
const detail = readFileSync('src/views/game-provider/finance/reconciliation/detail.vue', 'utf8')
assert.match(detail, /重新計算（未開放）/)
assert.doesNotMatch(detail, /store\.recalculateMerchant/)
console.log('CSV encoding, formula protection, download lifecycle and page contracts passed')
