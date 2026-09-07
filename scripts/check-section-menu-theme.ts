import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computed, reactive } from 'vue'
import { sectionMenuStyle } from '../src/utils/navigation/section-menu-theme'
import { MenuThemeEnum } from '../src/enums/appEnum'

const theme = reactive({
  theme: MenuThemeEnum.DARK,
  textColor: '#BABBBD',
  iconColor: '#BABBBD',
  background: '#191A23',
  systemNameColor: '#D9DADB'
})
const style = computed(() => sectionMenuStyle(theme))
assert.equal(style.value['--section-text'], theme.textColor)
assert.equal(style.value['--section-icon'], theme.iconColor)
assert.equal(style.value['--section-muted'], theme.textColor)
assert.equal(style.value['--section-active-text'], '#ffffff')
const luminance = (hex: string) => {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((value) => {
      const n = parseInt(value, 16) / 255
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
    })
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}
const contrast = (a: string, b: string) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
assert.ok(contrast(theme.textColor, theme.background) >= 4.5)
assert.ok(contrast(theme.textColor, style.value['--section-hover']) >= 4.5)
assert.ok(contrast(style.value['--section-active-text'], style.value['--section-active-bg']) >= 4.5)
for (const type of [MenuThemeEnum.LIGHT, MenuThemeEnum.DESIGN]) {
  Object.assign(theme, { theme: type, textColor: '#29343D', iconColor: '#6B6B6B' })
  assert.equal(style.value['--section-text'], '#29343D')
  assert.equal(style.value['--section-active-text'], 'var(--el-color-primary)')
}
Object.assign(theme, { theme: MenuThemeEnum.DARK, textColor: 'rgba(255, 255, 255, 0.7)' })
assert.equal(style.value['--section-text'], theme.textColor)
const source = readFileSync(
  'src/components/core/layouts/art-menus/art-sidebar-menu/widget/GgapSectionMenu.vue',
  'utf8'
)
assert.match(source, /:style="menuStyle"/)
assert.match(source, /button:not\(:disabled\), a\[href\]/)
assert.match(source, /element.tabIndex >= 0 && element.getClientRects\(\).length > 0/)
assert.match(source, /sectionMenuStyle\(props.theme\)/)
assert.doesNotMatch(source, /:global\(\.dark/)
for (const token of ['text', 'icon', 'muted', 'hover', 'active-bg', 'active-text', 'focus'])
  assert.ok(source.includes(`var(--section-${token})`))
assert.match(
  readFileSync('src/components/core/layouts/art-menus/art-sidebar-menu/index.vue', 'utf8'),
  /:theme="getMenuTheme"/
)
assert.doesNotMatch(readFileSync('src/config/index.ts', 'utf8'), /rgba\(#/)
console.log(
  'Section-menu palette, reactive switching, dark text contrast and source wiring passed; browser visual acceptance remains separate.'
)
