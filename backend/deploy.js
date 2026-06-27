import archiver from 'archiver'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { exec } from 'child_process'
import path from 'path'

const REGION = 'ap-southeast-1'
const ALL = ['navio-trips', 'navio-places', 'navio-ai-plan', 'navio-share', 'navio-reviews', 'navio-upload']
const targets = process.argv[2] ? [process.argv[2]] : ALL

mkdirSync('dist', { recursive: true })

function run(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, _stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve()
    })
  })
}

function zipAndDeploy(fnName) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join('dist', `${fnName}.zip`)
    const output = createWriteStream(zipPath)
    const archive = archiver('zip')

    archive.pipe(output)
    archive.directory(`functions/${fnName}/`, false)
    archive.finalize()

    output.on('close', () => {
      process.stdout.write(`Deploying ${fnName}... `)
      exec(
        `aws lambda update-function-code --function-name ${fnName} --zip-file fileb://${zipPath} --region ${REGION}`,
        (err, _stdout, stderr) => {
          if (err) { console.error(`❌\n${stderr}`); reject(err) }
          else { console.log('✅'); resolve() }
        }
      )
    })
  })
}

async function deployFunction(fnName) {
  const fnDir = path.join('functions', fnName)
  const hasPkg = existsSync(path.join(fnDir, 'package.json'))

  if (hasPkg) {
    process.stdout.write(`Installing deps for ${fnName}... `)
    await run('npm install --omit=dev', fnDir)
    console.log('✅')
  }

  await zipAndDeploy(fnName)
}

for (const fn of targets) {
  await deployFunction(fn)
}
