<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    value: number | string | null | undefined
    currency?: string
    showSign?: boolean
    compact?: boolean
    color?: string
    precision?: number
}

const props = withDefaults(defineProps<Props>(), {
    currency: 'USD',
    showSign: false,
    compact: false,
    color: '',
    precision: undefined
})

const currencyPrecision: Record<string, number> = {
    VND: 0,
    IDR: 0,
    TWD: 2,
    PHP: 2,
    THB: 2,
    USD: 2,
    CNY: 2,
    USDT: 4
}

const numericValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') return null
    const parsed = Number(props.value)
    return Number.isFinite(parsed) ? parsed : null
})

const formattedValue = computed(() => {
    if (numericValue.value === null) return '-'

    const absValue = Math.abs(numericValue.value)
    const digits = props.precision ?? currencyPrecision[props.currency] ?? 2

    if (props.compact && absValue >= 1000000) {
        return `${(absValue / 1000000).toFixed(2)}M`
    }

    if (props.compact && absValue >= 1000) {
        return `${(absValue / 1000).toFixed(1)}K`
    }

    return absValue.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    })
})

const currencySymbol = computed(() => {
    const symbols: Record<string, string> = {
        USD: '$',
        TWD: 'NT$',
        CNY: 'CNY ',
        PHP: 'PHP ',
        THB: 'THB ',
        VND: 'VND ',
        IDR: 'IDR ',
        USDT: 'USDT '
    }

    return symbols[props.currency] || `${props.currency} `
})

const colorClass = computed(() => {
    if (props.color) return props.color
    if (numericValue.value === null) return 'text-gray-500'
    if (numericValue.value > 0) return 'text-green-500'
    if (numericValue.value < 0) return 'text-red-500'
    return 'text-gray-400'
})

const signPrefix = computed(() => {
    if (!props.showSign || numericValue.value === null) return ''
    if (numericValue.value > 0) return '+'
    if (numericValue.value < 0) return '-'
    return ''
})
</script>

<template>
    <span :class="['font-mono tabular-nums', colorClass]">
        <template v-if="numericValue !== null">{{ signPrefix }}{{ currencySymbol }}{{ formattedValue }}</template>
        <template v-else>待日結</template>
    </span>
</template>
