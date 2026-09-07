import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const base = resolve(root, 'docs/stage1-evidence')
mkdirSync(base, { recursive: true })
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name)
    return entry.isSymbolicLink() ? [] : entry.isDirectory() ? walk(path) : [path]
  })
const snapshot = () => {
  const paths = [
    ...walk(resolve(root, 'src')),
    ...walk(resolve(root, 'scripts')),
    ...readdirSync(root)
      .filter((p) =>
        /^(package\.json|pnpm-lock\.yaml|tsconfig.*\.json|vite\.config\.ts|eslint\.config\..*)$/.test(
          p
        )
      )
      .map((p) => resolve(root, p))
  ]
  const git = (args) =>
    spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout?.trim() || null
  return {
    recordedAt: new Date().toISOString(),
    root,
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: git(['rev-parse', 'HEAD']),
    files: paths.sort().map((p) => ({
      path: relative(root, p).replaceAll('\\', '/'),
      sha256: createHash('sha256').update(readFileSync(p)).digest('hex')
    }))
  }
}
const [mode, ...args] = process.argv.slice(2)
if (mode === 'baseline') {
  const path = resolve(base, `baseline-${Date.now()}.json`)
  writeFileSync(path, JSON.stringify(snapshot(), null, 2))
  console.log(path)
} else if (mode === 'run') {
  const allowed = /^[\w./:@*=-]+$/
  if (!args.length || args.some((arg) => !allowed.test(arg)))
    throw new Error('Unsupported command argument')
  const dir = resolve(base, `run-${Date.now()}`)
  mkdirSync(dir)
  const start = snapshot()
  writeFileSync(resolve(dir, 'baseline-start.json'), JSON.stringify(start, null, 2))
  const stdout = [],
    stderr = []
  const child = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: root,
    shell: process.platform === 'win32',
    windowsHide: true
  })
  child.stdout.on('data', (chunk) => {
    stdout.push(chunk)
    process.stdout.write(chunk)
  })
  child.stderr.on('data', (chunk) => {
    stderr.push(chunk)
    process.stderr.write(chunk)
  })
  child.on('error', (error) => stderr.push(Buffer.from(String(error))))
  child.on('close', (code) => {
    writeFileSync(resolve(dir, 'stdout.log'), Buffer.concat(stdout))
    writeFileSync(resolve(dir, 'stderr.log'), Buffer.concat(stderr))
    const end = snapshot()
    writeFileSync(resolve(dir, 'baseline-end.json'), JSON.stringify(end, null, 2))
    const startMap = new Map(start.files.map((f) => [f.path, f.sha256]))
    const changed = end.files.filter((f) => startMap.get(f.path) !== f.sha256).map((f) => f.path)
    const removed = start.files
      .filter((f) => !end.files.some((e) => e.path === f.path))
      .map((f) => f.path)
    const result = {
      command: ['pnpm', ...args],
      startedAt: start.recordedAt,
      endedAt: end.recordedAt,
      exitCode: code,
      changed,
      removed
    }
    writeFileSync(resolve(dir, 'result.json'), JSON.stringify(result, null, 2))
    console.log(`\nEvidence: ${dir}`)
    process.exitCode = code ?? 1
  })
} else throw new Error('Use baseline or run <pnpm arguments>')
