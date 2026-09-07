<template>
  <nav
    ref="navigation"
    class="ggap-sections"
    :class="{ collapsed }"
    :style="menuStyle"
    aria-label="主要功能"
    @keydown.esc="emit('close')"
    @keydown.tab="trapMobileFocus"
  >
    <button v-if="mobile" type="button" class="close-navigation" @click="emit('close')"
      >關閉選單 <ArtSvgIcon icon="ri:close-line"
    /></button>
    <section v-for="section in sections" :key="section.path" :aria-label="String(section.title)">
      <h2 :class="{ 'sr-only': collapsed }">{{ $t(section.title) }}</h2>
      <template v-for="item in section.items" :key="item.path">
        <template v-if="item.children?.length">
          <template v-if="collapsed">
            <ElTooltip
              v-for="child in item.children"
              :key="child.path"
              :content="$t(child.meta.title)"
              placement="right"
              :show-after="150"
            >
              <RouterLink
                :to="child.path"
                class="function-link"
                :class="{ active: activePath === child.path }"
                :aria-current="activePath === child.path ? 'page' : undefined"
                :aria-label="$t(child.meta.title)"
                @click="emit('close')"
              >
                <ArtSvgIcon :icon="child.meta.icon || item.meta.icon" aria-hidden="true" />
              </RouterLink>
            </ElTooltip>
          </template>
          <div v-else class="function-group">
            <button
              type="button"
              class="function-link group-trigger"
              :class="{ active: groupIsActive(item) }"
              :aria-expanded="expandedGroups.has(item.path)"
              @click="toggleGroup(item.path)"
            >
              <ArtSvgIcon :icon="item.meta.icon || 'ri:folder-line'" aria-hidden="true" />
              <span>{{ $t(item.meta.title) }}</span>
              <ArtSvgIcon
                class="group-arrow"
                :icon="
                  expandedGroups.has(item.path) ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'
                "
                aria-hidden="true"
              />
            </button>
            <div v-show="expandedGroups.has(item.path)" class="group-children">
              <RouterLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="function-link child-link"
                :class="{ active: activePath === child.path }"
                :aria-current="activePath === child.path ? 'page' : undefined"
                @click="emit('close')"
              >
                <ArtSvgIcon :icon="child.meta.icon || 'ri:file-list-3-line'" aria-hidden="true" />
                <span>{{ $t(child.meta.title) }}</span>
              </RouterLink>
            </div>
          </div>
        </template>
        <ElTooltip
          v-else
          :content="$t(item.meta.title)"
          placement="right"
          :disabled="!collapsed"
          :show-after="150"
        >
          <RouterLink
            :to="item.path"
            class="function-link"
            :class="{ active: activePath === item.path }"
            :aria-current="activePath === item.path ? 'page' : undefined"
            :aria-label="$t(item.meta.title)"
            :title="collapsed ? $t(item.meta.title) : undefined"
            @click="emit('close')"
          >
            <ArtSvgIcon :icon="item.meta.icon || 'ri:file-list-3-line'" aria-hidden="true" />
            <span v-if="!collapsed">{{ $t(item.meta.title) }}</span>
          </RouterLink>
        </ElTooltip>
      </template>
    </section>
  </nav>
</template>
<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import type { AppRouteRecord } from '@/types/router'
  import type { MenuThemeType } from '@/types/store'
  import { sectionMenuStyle } from '@/utils/navigation/section-menu-theme'
  import { buildSectionMenu } from '@/utils/navigation/section-menu'
  const props = defineProps<{
    routes: AppRouteRecord[]
    theme: MenuThemeType
    activePath: string
    collapsed: boolean
    mobile: boolean
    open: boolean
  }>()
  const emit = defineEmits<{ close: [] }>()
  const menuStyle = computed(() => sectionMenuStyle(props.theme))
  const sections = computed(() => buildSectionMenu(props.routes))
  const navigation = ref<HTMLElement>()
  const expandedGroups = ref(new Set<string>())
  const groupIsActive = (item: AppRouteRecord) =>
    Boolean(item.children?.some((child) => child.path === props.activePath))
  const toggleGroup = (path: string) => {
    const next = new Set(expandedGroups.value)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    expandedGroups.value = next
  }
  const trapMobileFocus = (event: KeyboardEvent) => {
    if (!props.mobile || !props.open) return
    const controls = Array.from(
      navigation.value?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || []
    ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
    if (!controls?.length) return
    const first = controls[0],
      last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  watch(
    () => [props.activePath, props.open],
    async () => {
      const nextExpanded = new Set(expandedGroups.value)
      for (const section of sections.value) {
        for (const item of section.items) {
          if (groupIsActive(item)) nextExpanded.add(item.path)
        }
      }
      expandedGroups.value = nextExpanded
      await nextTick()
      navigation.value?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
      if (props.mobile && props.open)
        navigation.value?.querySelector<HTMLButtonElement>('button')?.focus()
    },
    { immediate: true }
  )
</script>
<style scoped>
  .ggap-sections {
    padding: 12px 8px 24px;
  }
  section + section {
    margin-top: 20px;
  }
  h2 {
    margin: 0 10px 6px;
    color: var(--section-muted);
    font-size: 12px;
    line-height: 20px;
    font-weight: 500;
  }
  .function-link {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: var(--el-border-radius-base);
    color: var(--section-text);
    font-size: 14px;
    text-decoration: none;
  }
  .function-group + .function-link,
  .function-link + .function-group,
  .function-group + .function-group {
    margin-top: 2px;
  }
  .group-trigger {
    width: 100%;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  .group-trigger span {
    flex: 1;
  }
  .group-arrow {
    font-size: 16px !important;
  }
  .group-children {
    position: relative;
    margin: 2px 0 6px 20px;
    padding-left: 9px;
    border-left: 1px solid var(--section-border);
  }
  .child-link {
    min-height: 38px;
    padding-block: 6px;
    font-size: 13px;
  }
  .child-link :deep(.art-svg-icon) {
    font-size: 17px;
  }
  .function-link :deep(.art-svg-icon) {
    color: var(--section-icon);
    flex-shrink: 0;
    font-size: 20px;
  }
  .function-link:hover {
    background: var(--section-hover);
  }
  .function-link.active {
    color: var(--section-active-text);
    background: var(--section-active-bg);
  }
  .function-link.active :deep(.art-svg-icon) {
    color: var(--section-active-text);
  }
  .function-link:focus-visible,
  .close-navigation:focus-visible {
    outline: 2px solid var(--section-focus);
    outline-offset: -2px;
  }
  .collapsed .function-link {
    justify-content: center;
    padding-inline: 0;
  }
  .collapsed section + section {
    margin-top: 12px;
  }
  .close-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    background: var(--section-hover);
    color: var(--section-text);
    border-radius: var(--el-border-radius-base);
    cursor: pointer;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
</style>
