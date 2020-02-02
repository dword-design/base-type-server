import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import P from 'path'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'

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
    'src/index.js': 'export default 1 |> x => x * 2',
  })
  await spawn('base', ['prepare'])
  await spawn('base', ['prepublishOnly'])
  expect(require(P.resolve('dist'))).toEqual(2)
})
