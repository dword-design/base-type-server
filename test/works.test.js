import { spawn } from 'child_process'
import withLocalTmpDir from 'with-local-tmp-dir'
import expect from 'expect'
import P from 'path'
import outputFiles from 'output-files'
import { minimalPackageConfig, minimalProjectConfig } from '@dword-design/base'
import waitOn from 'wait-on'
import glob from 'glob-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@functions'
import { outputFile } from 'fs'
import stealthyRequire from 'stealthy-require'

export const it = async () => {

  const files = {
    ...minimalProjectConfig,
    'package.json': JSON.stringify(sortPackageJson({
      ...minimalPackageConfig,
      devDependencies: {
        '@dword-design/base-config-server': '^1.0.0',
      },
    }), undefined, 2),
    'src/index.js': 'export default \'foo\'',
    src: {
      'cli.js': endent`
        #!/usr/bin/env node

        import api from '.'

        console.log(api)
      `,
      'foo.txt': '',
    },
  }

  await withLocalTmpDir(__dirname, async () => {
    await outputFiles(files)
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
    expect(require(P.resolve('dist'))).toEqual('foo')
    expect(stdout).toEqual(endent`
      Copying config files …
      Updating README.md …
      Successfully compiled 2 files with Babel.
    ` + '\n')
  })

  await withLocalTmpDir(__dirname, async () => {
    await outputFiles(files)
    const childProcess = await spawn('base', ['start'], { capture: ['stdout'] })
      .catch(error => {
        expect(error.stdout).toEqual(endent`
          Successfully compiled 2 files with Babel.
          foo
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
}

export const timeout = 20000
