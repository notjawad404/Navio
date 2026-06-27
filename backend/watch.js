import chokidar from 'chokidar'
import archiver from 'archiver'
import { createWriteStream, mkdirSync } from 'fs'
import { exec } from 'child_process'
import path from 'path'

const REGION = 'ap-southeast-1'
const pending = new Map()

function deployFunction(fnName) {
  console.log(`\n⚡ Change detected in ${fnName} — deploying...`)

  mkdirSync('dist', { recursive: true })

  const zipPath = path.join('dist', `${fnName}.zip`)
  const output = createWriteStream(zipPath)
  const archive = archiver('zip')

  archive.pipe(output)
  archive.directory(`functions/${fnName}/`, false)
  archive.finalize()

  output.on('close', () => {
    exec(
      `aws lambda update-function-code --function-name ${fnName} --zip-file fileb://${zipPath} --region ${REGION}`,
      (err, _stdout, stderr) => {
        if (err) {
          console.error(`❌ Failed: ${fnName}\n`, stderr)
        } else {
          console.log(`✅ ${fnName} deployed`)
        }
      }
    )
  })
}

function debouncedDeploy(fnName) {
  if (pending.has(fnName)) clearTimeout(pending.get(fnName))
  pending.set(fnName, setTimeout(() => {
    pending.delete(fnName)
    deployFunction(fnName)
  }, 500))
}

chokidar
  .watch('functions', { ignoreInitial: true, persistent: true })
  .on('change', (filePath) => {
    const fnName = filePath.replace(/\\/g, '/').split('/')[1]
    if (fnName) debouncedDeploy(fnName)
  })
  .on('add', (filePath) => {
    const fnName = filePath.replace(/\\/g, '/').split('/')[1]
    if (fnName) debouncedDeploy(fnName)
  })

console.log('👀 Watching Lambda functions for changes...')
console.log(`   Region: ${REGION}`)
console.log('   Edit any file in functions/ to auto-deploy\n')
