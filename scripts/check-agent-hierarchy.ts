import assert from 'node:assert/strict'
import { newAgentLevel } from '../src/domain/agent-hierarchy'
import { agentMockData } from '../src/mock/game-provider'
import type { AgentRecord } from '../src/types/game-provider'
const agents = ['L1', 'L2', 'L3'].map((level, index) => ({
  ...agentMockData[0],
  id: `A${index}`,
  level,
  status: 'Active'
})) as AgentRecord[]
assert.equal(newAgentLevel(agents), 'L1')
assert.equal(newAgentLevel(agents, 'A0'), 'L2')
assert.equal(newAgentLevel(agents, 'A1'), 'L3')
assert.throws(() => newAgentLevel(agents, 'A2'), /三級/)
assert.throws(() => newAgentLevel(agents, 'missing'), /不存在/)
agents[0].status = 'Suspended'
assert.throws(() => newAgentLevel(agents, 'A0'), /未啟用/)
console.log('Hierarchy checks passed: fixed L1/L2/L3, no L4, missing/inactive parent rejected.')
