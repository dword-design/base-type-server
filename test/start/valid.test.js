import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import P from 'path'
import outputFiles from 'output-files'
import waitOn from 'wait-on'
import glob from 'glob-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import { outputFile } from 'fs-extra'
import stealthyRequire from 'stealthy-require'
import packageConfig from '../package.config'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': JSON.stringify(sortPackageJson({
      ...packageConfig,
      devDependencies: {
        '@dword-design/base-config-server': '^1.0.0',
      },
    }), undefined, 2),
    'src/index.js': 'export default 1 |> x => x * 2',
    src: {
      'cli.js': endent`
        #!/usr/bin/env node

        import api from '.'

        console.log(api)
      `,
      'foo.txt': '',
      'index.js': 'export default 1',
    },
  })
  const childProcess = await spawn('base', ['start'], { capture: ['stdout'] })
    .catch(error => {
      expect(error.stdout).toEqual(endent`
        Copying config files …
        Updating README.md …
        Successfully compiled 2 files with Babel.
        2
        Successfully compiled 2 files with Babel.
        bar
      ` + '\n')
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  try {
    await waitOn({ resources: [P.join('dist', 'cli.js'), P.join('dist', 'index.js'), P.join('dist', 'foo.txt')] })
    expect(await glob('*', { cwd: 'dist', dot: true })).toEqual([
      'cli.js',
      'foo.txt',
      'index.js',
    ])
    await outputFile(P.join('src', 'index.js'), 'export default \'bar\'')
    await waitOn({ resources: [P.join('dist', 'cli.js'), P.join('dist', 'index.js')] })
    await waitOn({ resources: [P.join('dist', 'cli.js'), P.join('dist', 'index.js')] })
    expect(stealthyRequire(require.cache, () => require(P.resolve('dist')))).toEqual('bar')
  } finally {
    childProcess.kill()
  }
})
