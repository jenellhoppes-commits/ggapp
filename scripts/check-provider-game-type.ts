import assert from 'node:assert/strict'
import { createDemoState } from '../src/domain/provider-demo'
import { saveProvider } from '../src/domain/provider-core'
import { ensureGameCatalog, saveGameDisplay } from '../src/domain/game-sync'
const state = createDemoState()
ensureGameCatalog(state)
const p = state.providers[0]
const games = state.games.filter((g) => g.providerId === p.id)
const actor = { roles: ['R_ADMIN'], name: 'test' }
const update = (type: string) =>
  saveProvider(
    state,
    p.id,
    { code: p.profile!.code, name: p.name, contact: '', note: '', defaultGameType: type },
    p.profile!.version,
    actor
  )
update('電子遊戲')
assert.ok(games.every((g) => g.type === '電子遊戲'))
const game = games[0]
saveGameDisplay(
  state,
  game.id,
  { name: game.name, active: game.active, tags: game.tags, type: '真人娛樂' },
  game.version!,
  actor
)
update('捕魚遊戲')
assert.equal(game.type, '真人娛樂')
assert.ok(games.slice(1).every((g) => g.type === '捕魚遊戲'))
saveGameDisplay(
  state,
  game.id,
  { name: game.name, active: game.active, tags: game.tags, type: '__inherit' },
  game.version!,
  actor
)
assert.equal(game.type, '捕魚遊戲')
update('棋牌')
assert.equal(game.type, '棋牌')
assert.equal(game.typeOverridden, false)
assert.throws(() => update('invalid'), /類型/)
console.log(
  'Passed: provider defaults, per-game override, restore inheritance, default updates and validation'
)
