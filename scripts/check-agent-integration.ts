import assert from 'node:assert/strict'
import { agentIntegrationRows } from '../src/domain/agent-integration'
import type { PortalSource } from '../src/domain/agent-portal'
const source = {
  agents: [
    { id: 'A', status: 'Active' },
    { id: 'B', parentAgentId: 'A', status: 'Active' },
    { id: 'X', status: 'Active' }
  ],
  merchants: [
    {
      id: 'M',
      agentId: 'A',
      lines: [
        {
          uid: 'L',
          currency: 'TWD',
          environment: 'Sandbox',
          status: 'Active',
          environments: [
            {
              environment: 'Sandbox',
              status: 'Testing',
              credential: { apiKey: 'SECRET' },
              endpoint: 'SECRET',
              callbackUrl: 'SECRET'
            }
          ]
        }
      ]
    },
    { id: 'N', agentId: 'B', lines: [{ uid: 'N', environments: [] }] },
    { id: 'X', agentId: 'X', lines: [{ uid: 'X', environments: [] }] }
  ],
  commercialTerms: [],
  merchantCommercialTerms: [],
  portalRateVersions: []
} as unknown as PortalSource
const tests = {
  L: [{ id: 'T', name: '連線', description: 'SECRET', required: true, status: 'Passed' as const }]
}
const actor = { roles: ['R_AGENT'], agentId: 'A', name: 'Test' }
const rows = agentIntegrationRows(source, actor, tests)
assert.deepEqual(
  rows.map((r) => r.merchantId),
  ['M', 'N']
)
assert.equal(rows[0].passed, 1)
assert.equal(rows[0].total, 1)
assert.equal(rows[1].total, 0)
assert.equal(rows[0].environment, 'Sandbox')
assert.equal(JSON.stringify(rows).includes('SECRET'), false)
assert.equal(agentIntegrationRows(source, { ...actor, agentId: undefined }, tests).length, 0)
assert.equal(agentIntegrationRows(source, { ...actor, roles: ['R_MERCHANT'] }, tests).length, 0)
source.agents[0].status = 'Disabled'
assert.equal(agentIntegrationRows(source, actor, tests).length, 0)
console.log(
  'Agent integration: descendants, identity denial, no credential/endpoint/trace exposure, test counts and environment separation passed'
)
