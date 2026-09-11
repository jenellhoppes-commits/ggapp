import assert from 'node:assert/strict'
import { saveAgentAccount, type AgentAccount } from '../src/domain/agent-accounts'
const owner: AgentAccount = {
  id: 'owner',
  agentId: 'A',
  name: 'Owner',
  account: 'owner@example.com',
  role: '代理管理員',
  status: '啟用'
}
const finance: AgentAccount = {
  ...owner,
  id: 'finance',
  account: 'finance@example.com',
  role: '財務'
}
const rows = [owner, finance]
const input: AgentAccount = { ...finance, id: 'new', account: 'new@example.com' }
assert.equal(saveAgentAccount(rows, 'owner', input, '新增財務').role, '財務')
assert.throws(() => saveAgentAccount(rows, 'finance', input, '測試'), /管理員/)
assert.throws(() => saveAgentAccount(rows, 'missing', input, '測試'), /管理員/)
assert.throws(() => saveAgentAccount(rows, 'owner', { ...input, agentId: 'B' }, '測試'), /其他代理/)
assert.throws(() => saveAgentAccount(rows, 'owner', { ...owner, status: '停用' }, '測試'), /自己/)
assert.throws(
  () => saveAgentAccount(rows, 'owner', { ...input, account: 'FINANCE@example.com' }, '測試'),
  /已存在/
)
assert.throws(() => saveAgentAccount(rows, 'owner', input, ''), /原因/)
assert.throws(
  () => saveAgentAccount(rows, 'owner', { ...input, account: 'invalid' }, '測試'),
  /電子郵件/
)
assert.throws(
  () => saveAgentAccount([{ ...owner, status: '停用' }], 'owner', input, '測試'),
  /啟用/
)
assert.equal(saveAgentAccount(rows, 'owner', { ...finance, status: '停用' }, '離職').status, '停用')
assert.equal(rows[1].status, '啟用')
console.log(
  'Agent account validation passed: role, ownership, self-protection, duplicate, email, reason, status and immutable input.'
)
