import assert from 'node:assert/strict'
import {
  agentScope,
  canEditRate,
  canViewAgentTerms,
  type PortalSource
} from '../src/domain/agent-portal'

const source = {
  agents: [
    { id: 'A', status: 'Active' },
    { id: 'B', parentAgentId: 'A', status: 'Active' },
    { id: 'C', parentAgentId: 'B', status: 'Active' },
    { id: 'X', status: 'Active' }
  ],
  merchants: [
    { id: 'M', agentId: 'A', status: 'Active' },
    { id: 'N', agentId: 'B', status: 'Active' },
    { id: 'Z', agentId: 'X', status: 'Active' }
  ],
  commercialTerms: [],
  merchantCommercialTerms: [],
  portalRateVersions: []
} as unknown as PortalSource
const actor = { roles: ['R_AGENT', 'R_AGENT_MANAGER'], agentId: 'A', name: 'Agent A' }
assert.deepEqual(
  agentScope(source, actor).agents.map((a) => a.id),
  ['B', 'C']
)
for (const id of ['A', 'B'])
  assert.equal(canViewAgentTerms(source, actor, { kind: 'agent', id }), true)
for (const id of ['C', 'X'])
  assert.equal(canViewAgentTerms(source, actor, { kind: 'agent', id }), false)
assert.equal(canViewAgentTerms(source, actor, { kind: 'merchant', id: 'M' }), true)
for (const id of ['N', 'Z'])
  assert.equal(canViewAgentTerms(source, actor, { kind: 'merchant', id }), false)
assert.equal(canEditRate(source, actor, { kind: 'agent', id: 'A' }), false)
assert.equal(canEditRate(source, actor, { kind: 'agent', id: 'B' }), true)
source.agents[0].status = 'Disabled'
assert.equal(canViewAgentTerms(source, actor, { kind: 'agent', id: 'B' }), false)
assert.equal(source.agents[1].status, 'Active')
console.log(
  'Agent terms: own/direct visibility, indirect exclusion, own readonly and disabled identity passed'
)
