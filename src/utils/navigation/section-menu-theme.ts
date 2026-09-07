import type { MenuThemeType } from '@/types/store'
import { MenuThemeEnum } from '@/enums/appEnum'

/** Menu appearance must not depend on the page's light/dark appearance. */
export function sectionMenuStyle(theme: MenuThemeType) {
  const dark = theme.theme === MenuThemeEnum.DARK
  return {
    '--section-text': theme.textColor,
    '--section-icon': theme.iconColor,
    '--section-muted': dark ? theme.textColor : 'var(--el-text-color-secondary)',
    '--section-hover': dark ? '#0f1015' : 'var(--el-fill-color-light)',
    '--section-active-bg': dark ? '#27282d' : 'var(--el-color-primary-light-9)',
    '--section-active-text': dark ? '#ffffff' : 'var(--el-color-primary)',
    '--section-border': dark ? '#55565e' : 'var(--art-border-color)',
    '--section-focus': dark ? '#ffffff' : 'var(--el-color-primary)'
  }
}
