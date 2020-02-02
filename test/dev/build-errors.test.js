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
      'index.js': 'export default 1',
    },
  })
  await spawn('base', ['prepare'])
  const childProcess = spawn('base', ['dev'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    if (data.toString() === '1\n') {
      resolve()
    }
  }))
  childProcess.stdout.removeAllListeners('data')
  await outputFile(P.join('src', 'index.js'), 'foo bar')
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    if (data.toString().includes('Unexpected token, expected ";"')) {
      resolve()
    }
  }))
  childProcess.stdout.removeAllListeners('data')
  await childProcess.kill()
})
