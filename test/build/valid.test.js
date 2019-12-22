import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import P from 'path'
import outputFiles from 'output-files'
import glob from 'glob-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
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
  const { stdout } = await spawn('base', ['build'], { capture: ['stdout'] })
  expect(await glob('*', { dot: true })).toEqual([
    '.editorconfig',
    '.eslintrc.json',
    '.gitignore',
    '.gitpod.yml',
    '.renovaterc.json',
    '.travis.yml',
    'dist',
    'LICENSE.md',
    'package.json',
    'README.md',
    'src',
  ])
  expect(require(P.resolve('dist'))).toEqual(2)
  expect(stdout).toEqual(endent`
    Copying config files …
    Updating README.md …
    Successfully compiled 2 files with Babel.
  ` + '\n')
})
