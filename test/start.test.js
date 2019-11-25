import { spawn } from 'child_process'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import waitForChange from 'wait-for-change'
import importFresh from 'import-fresh'
import { resolve, join } from 'path'
import outputFiles from 'output-files'
import { outputFile, readFile } from 'fs'
import resolveBin from 'resolve-bin'
import { endent } from '@functions'
import delay from 'delay'
import { minimalProjectConfig } from '@dword-design/base'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    ...minimalProjectConfig,
    'src/index.js': 'export default 1',
    'src/cli.js': endent`
      #!/usr/bin/env node

      import api from '.'
      import { outputFile } from 'fs'

      outputFile('foo.txt', api)
    `,
  })

  const childProcess = await spawn(resolveBin.sync('@dword-design/base-server', { executable: 'base-server' }), ['start'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  try {
    await waitForChange(join('dist', 'index.js'))
    expect(require(resolve('dist'))).toEqual(1)
    await delay(700)
    expect(await readFile('foo.txt', 'utf8')).toEqual('1')
    await outputFile(join('src', 'index.js'), 'export default 2')
    await waitForChange(join('dist', 'index.js'))
    expect(importFresh(resolve('dist'))).toEqual(2)
    await delay(700)
    expect(await readFile('foo.txt', 'utf8')).toEqual('2')
  } finally {
    childProcess.kill()
  }
})
export const timeout = 20000
