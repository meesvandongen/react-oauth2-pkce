import { execSync } from 'child_process'
import { join } from 'path'

async function globalTeardown() {
  const e2eDir = join(__dirname)

  console.log('🐳 Stopping Dex Docker container...')
  try {
    execSync('docker compose -f docker-compose.yaml down', {
      stdio: 'inherit',
      cwd: e2eDir,
    })
    console.log('✅ Docker containers stopped')
  } catch (error) {
    console.error('⚠️ Failed to stop Docker containers:', error)
  }
}

export default globalTeardown
