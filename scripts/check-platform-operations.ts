import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  maintenanceRangeError,
  normalizeNetworkValue,
  validateNetworkValue,
  networkRuleKey,
  isRuleExpired
} from '../src/domain/platform-operations'

assert.equal(validateNetworkValue('203.0.113.10', 'IPv4'), '')
assert.ok(validateNetworkValue('203.0.113.999', 'IPv4'))
assert.equal(validateNetworkValue('203.0.113.0/24', 'CIDR'), '')
assert.ok(validateNetworkValue('203.0.113.0/33', 'CIDR'))
assert.equal(validateNetworkValue('*.example.com', 'Domain'), '')
assert.equal(normalizeNetworkValue('HTTPS://API.Example.com/', 'Domain'), 'api.example.com')
assert.equal(maintenanceRangeError('2026-09-05 01:00:00', '2026-09-05 02:00:00'), '')
assert.ok(maintenanceRangeError('2026-09-05 02:00:00', '2026-09-05 01:00:00'))
assert.equal(
  networkRuleKey({
    listType: 'Allow',
    scope: 'AdminLogin',
    environment: 'All',
    merchant: '',
    value: '10.20.0.0/16'
  }),
  'Allow|AdminLogin|All||10.20.0.0/16'
)
assert.equal(
  isRuleExpired({ expiresAt: '2026-09-04 00:00:00' }, new Date('2026-09-05T00:00:00Z')),
  true
)
assert.equal(isRuleExpired({ expiresAt: '' }, new Date('2026-09-05T00:00:00Z')), false)

const routes = readFileSync('src/router/modules/navigation.ts', 'utf8')
const maintenance = readFileSync('src/views/game-provider/platform/maintenance/index.vue', 'utf8')
const network = readFileSync('src/views/game-provider/platform/network-lists/index.vue', 'utf8')
assert.match(routes, /game-provider\/platform\/maintenance\/index/)
assert.match(routes, /game-provider\/platform\/network-lists\/index/)
assert.doesNotMatch(
  routes.slice(
    routes.indexOf("path: '/platform/maintenance'"),
    routes.indexOf('const systemOrder')
  ),
  /尚未實作/
)
for (const label of ['維護狀態', '維護排程', '異動紀錄', '新增維護排程'])
  assert.ok(maintenance.includes(label))
for (const label of ['白名單', '黑名單', 'IPv4 CIDR', '異動紀錄'])
  assert.ok(network.includes(label))
console.log(
  'Platform operations checks passed: maintenance schedules, network lists, validation and routes.'
)
