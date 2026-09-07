import assert from 'node:assert/strict'
import {
  createDemoState,
  createDemoLink,
  launchDemo,
  linkStatus,
  manageDemoLink,
  validateDemoInput,
  visibleLinks,
  type DemoActor,
  type DemoInput
} from '../src/domain/provider-demo'
import { integrationCases, runIntegrationDemo, sandboxError } from '../src/domain/integration-demo'
import { merchantRecords } from '../src/mock/game-provider'
import { createPinia, setActivePinia } from 'pinia'
import { useBusinessPartnerStore } from '../src/store/modules/businessPartner'
import { projectMerchantAccess } from '../src/domain/game-availability'

const admin: DemoActor = { role: 'admin', name: '管理者' }
const merchant: DemoActor = { role: 'merchant', name: '商戶', merchantId: 'M00001' }
const otherMerchant: DemoActor = { ...merchant, merchantId: 'M00002' }
const state = createDemoState()
setActivePinia(createPinia())
const business = useBusinessPartnerStore()
state.merchants = projectMerchantAccess(
  business.merchants,
  business.merchantGameConfigurations,
  business.merchantLineGameConfigurations
)
const input: DemoInput = {
  name: '單遊戲試玩',
  purpose: 'internal',
  providerId: 'PV00001',
  gameId: 'G00001',
  lineId: 'PV00001-TWD',
  locale: 'zh-TW',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  maxStarts: 2
}
const invalid = (change: Partial<DemoInput>) =>
  assert.throws(() => validateDemoInput(state, { ...input, ...change }, admin))
invalid({ name: ' ' })
invalid({ expiresAt: 'not-a-date' })
invalid({ expiresAt: new Date(0).toISOString() })
invalid({ maxStarts: 0 })
invalid({ maxStarts: 1.5 })
invalid({ lineId: 'PV00002-TWD' })
invalid({ gameId: 'G00002' })
invalid({ locale: 'unsupported' })
invalid({ initialCredit: 100 })
invalid({ purpose: 'merchant' })
invalid({ merchantId: 'M00002' })
invalid({ providerId: 'PV00003', gameId: 'G00003', lineId: 'PV00003-TWD' })
assert.throws(() => createDemoLink(state, input, merchant))
assert.throws(() => createDemoLink(state, input, { role: 'denied', name: '未知' }))
assert.throws(() =>
  createDemoLink(state, { ...input, purpose: 'merchant', merchantId: 'M00002' }, merchant)
)
const link = createDemoLink(state, input, admin)
assert.equal(link.mode, 'native')
assert.equal(visibleLinks(state, merchant).length, 0)
const merchantLink = createDemoLink(
  state,
  { ...input, purpose: 'merchant', merchantId: 'M00001' },
  merchant
)
assert.equal(visibleLinks(state, merchant).length, 1)
assert.equal(visibleLinks(state, otherMerchant).length, 0)
assert.throws(() => manageDemoLink(state, merchantLink.id, otherMerchant, 'disable'))
assert.throws(() => launchDemo(state, link.token, true))
assert.equal(link.starts, 0)
const first = launchDemo(state, link.token)
const second = launchDemo(state, link.token)
assert.notEqual(first.id, second.id)
assert.equal(first.accounting, 'excluded')
assert.equal(first.environment, 'demo')
assert.equal(link.starts, 2)
assert.equal(linkStatus(state, link), '次數已用盡')
assert.throws(() => launchDemo(state, link.token))
const oldToken = link.token
const replacement = manageDemoLink(state, link.id, admin, 'regenerate')
assert.equal(link.token, oldToken)
assert.notEqual(replacement.token, oldToken)
assert.throws(() => launchDemo(state, oldToken))
assert.equal(link.starts, 2)
assert.equal(replacement.starts, 0)
assert.equal(state.sessions.length, 2, 'Regeneration must retain previous sessions')
manageDemoLink(state, replacement.id, admin, 'disable')
assert.throws(() => launchDemo(state, link.token))
assert.equal(state.sessions.length, 2, 'Disabling does not terminate existing sessions')
const latestLink = manageDemoLink(state, replacement.id, admin, 'regenerate')
state.providers[0].available = false
assert.equal(linkStatus(state, latestLink), '不可用')
assert.throws(() => launchDemo(state, latestLink.token))
state.providers[0].available = true
state.providers[0].billingExcluded = false
assert.throws(() => launchDemo(state, latestLink.token))
state.providers[0].billingExcluded = true
state.providers[0].lines[0].available = false
assert.throws(() => launchDemo(state, latestLink.token))
state.providers[0].lines[0].available = true
latestLink.expiresAt = new Date(0).toISOString()
assert.equal(linkStatus(state, latestLink), '已到期')
assert.throws(() => launchDemo(state, latestLink.token))
const sandboxLink = createDemoLink(
  state,
  {
    ...input,
    providerId: 'PV00002',
    gameId: 'G00002',
    lineId: 'PV00002-USD',
    locale: 'en-US',
    initialCredit: 100
  },
  admin
)
assert.equal(sandboxLink.mode, 'sandbox')
assert.equal(sandboxLink.initialCredit, 100)
assert.ok(!JSON.stringify(state.links).includes('apiKey'))
assert.ok(!JSON.stringify(state.sessions).includes('launchUrl'))

const line = structuredClone(merchantRecords[0].lines[0])
line.status = 'Active'
line.environments = [
  {
    id: 'test-env',
    environment: 'Sandbox',
    endpoint: 'https://not-called.invalid',
    callbackUrl: '',
    ipWhitelist: [],
    status: 'Active',
    updatedAt: '',
    credential: {
      id: 'test-credential',
      environment: 'Sandbox',
      apiKey: 'never-copy-this',
      fingerprint: 'test',
      apiVersion: 'v1',
      signatureVersion: 'v1',
      status: 'Active'
    }
  }
]
assert.equal(sandboxError(line), '')
const before = JSON.stringify(line)
const run = runIntegrationDemo(line, 'success')
assert.equal(JSON.stringify(line), before, 'Tests must not change the real merchant line')
assert.equal(run.balanceAfter, 1000)
assert.equal(run.mock, true)
assert.equal(run.accounting, 'excluded')
assert.ok(!JSON.stringify(run).includes('never-copy-this'))
assert.equal(
  runIntegrationDemo(line, 'callback-failure').rows.find((row) => row.operation === 'Bet')
    ?.errorCode,
  'MOCK_CALLBACK_TIMEOUT'
)
assert.equal(
  runIntegrationDemo(line, 'callback-failure').rows.find((row) => row.operation === 'Win')?.status,
  '未執行'
)
assert.equal(integrationCases('Seamless').length, 6)
assert.equal(integrationCases('Transfer').length, 8)
line.walletMode = 'Transfer'
assert.equal(runIntegrationDemo(line, 'success').rows.length, 8)
assert.equal(runIntegrationDemo(line, 'success').balanceAfter, 1000)
line.environments[0].credential!.status = 'Revoked'
assert.throws(() => runIntegrationDemo(line, 'success'))
line.environments[0].environment = 'Production'
assert.throws(() => runIntegrationDemo(line, 'success'))
console.log(
  'Provider demo checks passed: authorizations, capabilities, expiry, limits, rotation, failures, isolated sessions and sandbox wallet tests.'
)
