import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import P from 'path'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { outputFile } from 'fs-extra'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": "server",
        "devDependencies": {
          "@dword-design/base-config-server": "^1.0.0"
        }
      }

    `,
    src: {
      'cli.js': endent`
        #!/usr/bin/env node

        import api from '.'

        console.log(api)
      `,
      'index.js': 'export default 1 |> x => x * 2',
    },
  })
  const childProcess = spawn('base', ['start'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  try {
    await new Promise(resolve => childProcess.stdout.on('data', data => {
      if (data.toString() === '2\n') {
        resolve()
      }
    }))
    childProcess.stdout.removeAllListeners('data')
    await outputFile(P.join('src', 'index.js'), 'export default \'bar\'')
    await new Promise(resolve => childProcess.stdout.on('data', data => {
      if (data.toString() === 'bar\n') {
        resolve()
      }
    }))
    childProcess.stdout.removeAllListeners('data')
  } finally {
    childProcess.kill()
  }
})
