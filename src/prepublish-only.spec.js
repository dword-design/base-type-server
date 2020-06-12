import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import P from 'path'
import outputFiles from 'output-files'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
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
