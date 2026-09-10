import { agentScope, type PortalSource, type PortalActor } from './agent-portal'
import type { IntegrationTestItem } from '../types/game-provider'

export function agentIntegrationRows(
  source: PortalSource,
  actor: PortalActor,
  tests: Record<string, IntegrationTestItem[]>
) {
  const scope = agentScope(source, actor)
  return scope.merchants.flatMap((m) =>
    m.lines.map((line) => {
      const required = (tests[line.uid] || []).filter((t) => t.required)
      return {
        key: `${m.id}:${line.uid}`,
        merchantId: m.id,
        merchantCode: m.code,
        merchantName: m.name,
        agentId: m.agentId,
        direct: m.agentId === scope.own?.id,
        lineUid: line.uid,
        currency: line.currency,
        environment: line.environment,
        status: line.status,
        updatedAt: line.updatedAt,
        passed: required.filter((t) => t.status === 'Passed').length,
        total: required.length,
        // Do not expose endpoint, credentials, test descriptions, traces or raw errors.
        tests: (tests[line.uid] || []).map((t) => ({
          id: t.id,
          name: t.name,
          required: t.required,
          status: t.status,
          testedAt: t.testedAt
        })),
        environments: line.environments.map((e) => ({
          environment: e.environment,
          status: e.status,
          updatedAt: e.updatedAt
        }))
      }
    })
  )
}
