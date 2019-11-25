import { spawn } from 'child_process'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import { resolve, join } from 'path'
import { exists } from 'fs'
import outputFiles from 'output-files'
import resolveBin from 'resolve-bin'
import { minimalProjectConfig } from '@dword-design/base'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    ...minimalProjectConfig,
    'src/index.js': 'export default 1',
    'src/foo.txt': 'foo',
  })
  await spawn(
    resolveBin.sync('@dword-design/base-server', { executable: 'base-server' }),
    ['prepare']
  )
  expect(require(resolve('dist'))).toEqual(1)
  expect(await exists(join('dist', 'foo.txt'))).toBeTruthy()
})
export const timeout = 10000
