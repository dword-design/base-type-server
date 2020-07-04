import execa from 'execa'
import outputFiles from 'output-files'
import P from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'src/index.js': 'export default 1 |> x => x * 2',
      })
      await execa.command('base prepare')
      await execa.command('base prepublishOnly')
      expect(require(P.resolve('dist'))).toEqual(2)
    }),
}
