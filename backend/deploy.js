import archiver from 'archiver'
import { createWriteStream, mkdirSync } from 'fs'
import { exec } from 'child_process'
import path from 'path'

const REGION = 'ap-southeast-1'
const ALL = ['navio-trips', 'navio-places', 'navio-ai-plan', 'navio-share', 'navio-reviews']
const targets = process.argv[2] ? [process.argv[2]] : ALL

mkdirSync('dist', { recursive: true })

function deployFunction(fnName) {
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

for (const fn of targets) {
  await deployFunction(fn)
}
