import { execSync } from 'child_process'
import { join } from 'path'

async function globalSetup() {
  const e2eDir = join(__dirname)

  console.log('🐳 Pulling latest Dex image...')
  try {
    execSync('docker pull ghcr.io/dexidp/dex:latest', {
      stdio: 'inherit',
      cwd: e2eDir,
    })
  } catch (error) {
    console.warn('⚠️ Failed to pull latest image, using cached version')
  }

  console.log('🐳 Starting Dex Docker container...')
  execSync('docker compose -f docker-compose.yaml up -d dex', {
    stdio: 'inherit',
    cwd: e2eDir,
  })

  // Wait for Dex to be ready (5 second timeout)
  console.log('⏳ Waiting for Dex to be ready...')
  const maxRetries = 5
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync('curl -sf http://localhost:5556/dex/.well-known/openid-configuration', {
        stdio: 'pipe',
      })
      console.log('✅ Dex is ready!')
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('Dex failed to start within 5 seconds')
}

export default globalSetup
