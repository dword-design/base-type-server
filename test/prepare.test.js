import { spawn } from 'child_process'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import { resolve } from 'path'
import { outputFile } from 'fs'
import resolveBin from 'resolve-bin'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFile('src/index.js', 'export default 1')
  await spawn(
    resolveBin.sync('@dword-design/base-server', { executable: 'base-server' }),
    ['prepare']
  )
  expect(require(resolve('dist'))).toEqual(1)
})
export const timeout = 10000
