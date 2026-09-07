<script setup lang="ts">
import { NConfigProvider, NDialogProvider, NMessageProvider, NGlobalStyle, zhTW, dateZhTW, enUS, dateEnUS } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

// Lead Dev Note:
// Using NConfigProvider to enforce Dark Theme globally.
// NMessageProvider is required for useMessage() composable.
// NGlobalStyle handles global style resets from Naive UI.

const { locale } = useI18n()

// Theme Overrides for Light Green Primary
const themeOverrides = {
  common: {
    primaryColor: '#63e2b7', // Light Green
    primaryColorHover: '#7fe7c4',
    primaryColorPressed: '#5acea7',
    primaryColorSuppl: '#2a483e'
  },
  Button: {
    textColorPrimary: '#1a3b32' // Deep Green for better contrast on Light Green bg
  }
}

const naiveLocale = computed(() => {
  return locale.value === 'zh-TW' ? zhTW : enUS
})

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-TW' ? dateZhTW : dateEnUS
})
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <div class="min-h-screen">
          <router-view />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
