import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useBusinessPartnerStore } from '../src/store/modules/businessPartner'
import {
  createDemoState,
  createDemoLink,
  capabilityError,
  launchDemo,
  manageDemoLink,
  type DemoInput
} from '../src/domain/provider-demo'
import { activationChecks, changeLineStatus } from '../src/domain/provider-core'
import { projectMerchantAccess, gameAvailabilityError } from '../src/domain/game-availability'
import {
  ensureGameCatalog,
  startGameSync,
  finishGameSync,
  saveGameDisplay
} from '../src/domain/game-sync'
import { queryGames } from '../src/domain/game-query'
const actor = { roles: ['R_SUPER'], name: '第二批模擬驗收' }
const admin = { role: 'admin' as const, name: actor.name }
setActivePinia(createPinia())
const business = useBusinessPartnerStore()
const state = createDemoState()
state.providers[0].initialCredit = true // Explicit capability for this test adapter only.
ensureGameCatalog(state)
const refresh = () => {
  state.merchants = projectMerchantAccess(
    business.merchants,
    business.merchantGameConfigurations,
    business.merchantLineGameConfigurations
  )
}
refresh()
const p = state.providers[0],
  line = p.lines[0],
  g = state.games[0]
const input: DemoInput = {
  name: '第二批驗收連結',
  purpose: 'merchant',
  initialCredit: 100,
  merchantId: 'M00001',
  providerId: p.id,
  gameId: g.id,
  lineId: line.id,
  locale: g.locales[0],
  expiresAt: new Date(Date.now() + 3600000).toISOString()
}

// A1: same general adapter contract, no dependency on demo/billing.
p.mode = undefined
p.billingExcluded = false
assert.ok(activationChecks(state, p, line).every((c) => c.passed))
changeLineStatus(state, p.id, line.id, 'active', line.config!.version, '模擬啟用', actor)
assert.equal(gameAvailabilityError(state, g, line.id), '')
assert.match(capabilityError(state, input), /試玩/)
assert.throws(() => createDemoLink(state, input, admin))
line.config!.environment = 'production'
assert.throws(() =>
  changeLineStatus(state, p.id, line.id, 'active', line.config!.version, '禁止正式', actor)
)
line.config!.environment = 'sandbox'
p.mode = 'native'
p.billingExcluded = true
console.log('A1 PASS (simulation): independent general/demo gates; production still blocked')

// A2: currency alone never gives a game grant.
assert.equal(capabilityError(state, input), '')
const unauthorizedGame = state.games.find((g) => g.id === 'G00009')!
assert.match(gameAvailabilityError(state, unauthorizedGame, line.id, 'M00001'), /授權/)
console.log('A2 PASS (simulation): TWD availability does not imply game authorization')

// A3: shared UI evaluator and submit reject the same reasons.
const merchant = business.merchants[0]
const merchantLine = merchant.lines.find((l) => l.currency === 'TWD')!
const grant = business.merchantLineGameConfigurations[merchantLine.uid].find(
  (c) => c.gameId === g.id
)!
function reject(reason: RegExp) {
  refresh()
  const error = capabilityError(state, input)
  assert.match(error, reason)
  assert.throws(
    () => createDemoLink(state, input, admin),
    (e: unknown) => e instanceof Error && e.message === error
  )
}
merchantLine.currency = 'EUR'
reject(/同幣別/)
merchantLine.currency = 'TWD'
grant.enabled = false
reject(/授權/)
grant.enabled = true
const wallet = merchant.walletMode
merchant.walletMode = 'Transfer'
reject(/錢包/)
merchant.walletMode = wallet
const status = merchantLine.status
merchantLine.status = 'Suspended'
reject(/線路/)
merchantLine.status = status
merchantLine.environments[0].status = 'Disabled'
reject(/環境/)
merchantLine.environments[0].status = 'Testing'
refresh()
assert.equal(capabilityError(state, input), '')
assert.equal(capabilityError(state, { ...input, purpose: 'internal', merchantId: undefined }), '')
console.log(
  'A3 PASS (simulation): currency, grant, wallet, line and environment use shared rejection'
)

// A4/A5: stable source keys, manual edits, publication, authorization and omission protection.
const grantsBefore = JSON.stringify(state.merchants)
saveGameDisplay(
  state,
  g.id,
  { name: '人工名稱保留', active: true, tags: ['直式畫面'], type: '真人娛樂' },
  g.version!,
  actor
)
const run = startGameSync(state, p.id, actor)
assert.throws(() => startGameSync(state, p.id, actor), /正在同步/)
assert.equal(state.syncRuns![0].status, 'running')
finishGameSync(state, run, 'success', actor)
assert.equal(state.syncRuns![0].added, 1)
assert.equal(state.syncRuns![0].unavailable, 1)
const count = state.games.length
const newGame = state.games.find((g) => g.code === `MOCK-${p.id}-NEW`)!
assert.equal(newGame.active, false)
const second = startGameSync(state, p.id, actor)
finishGameSync(state, second, 'success', actor)
assert.equal(state.games.length, count)
assert.equal(g.name, '人工名稱保留')
assert.equal(g.type, '真人娛樂')
assert.throws(
  () =>
    saveGameDisplay(
      state,
      g.id,
      { name: g.name, active: true, tags: [], type: 'invalid' },
      g.version!,
      actor
    ),
  /類型/
)
assert.deepEqual(g.tags, ['直式畫面'])
assert.equal(JSON.stringify(state.merchants), grantsBefore)
assert.equal(state.syncRuns![0].added, 0)
assert.throws(
  () => saveGameDisplay(state, g.id, { name: '錯誤覆寫', active: false, tags: [] }, 1, actor),
  /版本衝突/
)
assert.throws(
  () =>
    saveGameDisplay(state, g.id, { name: '越權', active: false, tags: [] }, g.version!, {
      roles: ['R_AGENT'],
      name: '代理'
    }),
  /權限/
)
console.log(
  'A4 PASS (simulation): no duplicates, no manual/grant overwrite, new games unpublished, versions enforced'
)
unauthorizedGame.sourceAvailable = true
const untouched = JSON.stringify(unauthorizedGame)
const partial = startGameSync(state, p.id, actor)
finishGameSync(state, partial, 'partial', actor)
assert.equal(JSON.stringify(unauthorizedGame), untouched)
assert.equal(state.syncRuns![0].failed, 2)
const gamesBeforeFailure = JSON.stringify(state.games)
const failed = startGameSync(state, p.id, actor)
finishGameSync(state, failed, 'failed', actor)
assert.equal(JSON.stringify(state.games), gamesBeforeFailure)
const interrupted = startGameSync(state, p.id, actor)
state.syncRuns!.find((r) => r.id === interrupted)!.startedAt = new Date(
  Date.now() - 31000
).toISOString()
const recovery = startGameSync(state, p.id, actor)
assert.equal(state.syncRuns!.find((r) => r.id === interrupted)!.status, 'failed')
finishGameSync(state, recovery, 'failed', actor)
assert.equal(JSON.stringify(state.games), gamesBeforeFailure)
console.log('A5 PASS (simulation): partial/full failure preserves missing source records')

// A6: real business-store grant mutation updates the projection used by old links.
const link = createDemoLink(state, input, admin)
const session = launchDemo(state, link.token)
const sessionsBefore = JSON.stringify(state.sessions)
business.updateMerchantLineGameConfiguration(
  merchant.id,
  merchantLine.uid,
  g.id,
  { enabled: false },
  '第二批授權停用驗收'
)
refresh()
assert.throws(() => launchDemo(state, link.token))
assert.throws(
  () =>
    business.updateMerchantLineGameConfiguration(
      merchant.id,
      merchantLine.uid,
      g.id,
      { enabled: true },
      '第二批還原測試授權'
    ),
  /條件/
)
// Remaining scenarios test historical fixture sessions, not new production grants.
grant.enabled = true
refresh()
p.available = false
assert.throws(() => launchDemo(state, link.token))
p.available = true
line.available = false
assert.throws(() => launchDemo(state, link.token))
line.available = true
g.active = false
assert.throws(() => launchDemo(state, link.token))
g.active = true
assert.equal(JSON.stringify(state.sessions), sessionsBefore)
console.log('A6 PASS (simulation): revocation blocks new sessions, historical sessions retained')

// A7: original record identity, deadline, count and session foreign key never change.
const old = { token: link.token, expiry: link.expiresAt, starts: link.starts, id: link.id }
const replacement = manageDemoLink(
  state,
  link.id,
  admin,
  'regenerate',
  new Date(Date.now() + 7200000).toISOString()
)
assert.deepEqual(
  { token: link.token, expiry: link.expiresAt, starts: link.starts, id: link.id },
  old
)
assert.equal(link.replacedById, replacement.id)
assert.equal(replacement.replacesId, link.id)
assert.equal(session.linkId, link.id)
assert.equal(replacement.starts, 0)
assert.throws(() => launchDemo(state, old.token))
assert.throws(() => manageDemoLink(state, link.id, admin, 'regenerate'))
assert.equal(launchDemo(state, replacement.token).linkId, replacement.id)
const migrated = JSON.parse(JSON.stringify(state))
ensureGameCatalog(migrated)
assert.equal(JSON.stringify(migrated.links), JSON.stringify(state.links))
assert.equal(JSON.stringify(migrated.sessions), JSON.stringify(state.sessions))
console.log('A7 PASS (simulation): replacement lineage, immutable old history, old URL disabled')

// A8 domain half: URL query object replay, original-value order and pagination.
const query = { q: 'G0', sort: 'id', order: 'desc', page: '2', size: '10' }
assert.deepEqual(
  queryGames(state.games, query),
  queryGames(state.games, JSON.parse(JSON.stringify(query)))
)
assert.equal(queryGames(state.games, query).page, 2)
for (const size of [10, 20, 50]) assert.equal(queryGames(state.games, { size }).size, size)
assert.equal(queryGames(state.games, { size: 123 }).size, 10)
assert.ok(
  queryGames(state.games, { providerFilter: p.id }).items.every((g) => g.providerId === p.id)
)
assert.equal(queryGames(state.games, { q: 'does-not-exist' }).total, 0)
console.log(
  'A8 DOMAIN PASS (simulation): query replay, sort, 10/20/50 paging; browser evidence recorded separately'
)
