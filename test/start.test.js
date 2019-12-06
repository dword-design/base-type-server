import { spawn } from 'child_process'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import { resolve, join } from 'path'
import outputFiles from 'output-files'
import { outputFile, readFile } from 'fs'
import { endent } from '@functions'
import { minimalProjectConfig } from '@dword-design/base'
import waitOn from 'wait-on'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    ...minimalProjectConfig,
    'src/index.js': endent`
      import { outputFile } from 'fs'

      export default () => outputFile('foo.txt', 1)
    `,
    'src/cli.js': endent`
      #!/usr/bin/env node

      import api from '.'

      api()
    `,
  })

  const childProcess = await spawn('base-server', ['start'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  try {
    await waitOn({ resources: [join('dist', 'index.js'), 'foo.txt'] })
    expect(typeof require(resolve('dist'))).toEqual('function')
    expect(await readFile('foo.txt', 'utf8')).toEqual('1')
    await outputFile(join('src', 'index.js'), endent`
      import { outputFile } from 'fs'

      export default () => outputFile('foo.txt', 2)
    `)
    await waitOn({ resources: [join('dist', 'index.js'), 'foo.txt'] })
    expect(typeof require(resolve('dist'))).toEqual('function')
    expect(await readFile('foo.txt', 'utf8')).toEqual('2')
  } finally {
    childProcess.kill()
  }
})
export const timeout = 20000
