import { spawn } from 'child-process-promise'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
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
    src: {
      'cli.js': endent`
        #!/usr/bin/env node

        import api from '.'

        console.log(api)
      `,
      'foo.txt': '',
      'index.js': 'export default 1;',
    },
  })
  let stdout
  try {
    await spawn('base', ['build'], { capture: ['stdout'] })
  } catch (error) {
    stdout = error.stdout
  }
  expect(stdout).toMatch('Extra semicolon  semi')
  expect(await glob('*', { dot: true })).toEqual([
    '.editorconfig',
    '.eslintrc.json',
    '.gitignore',
    '.gitpod.yml',
    '.renovaterc.json',
    '.travis.yml',
    'LICENSE.md',
    'package.json',
    'README.md',
    'src',
  ])
})
