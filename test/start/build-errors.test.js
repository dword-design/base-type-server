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
      'index.js': 'export default 1',
    },
  })
  const childProcess = spawn('base', ['start'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  await waitOn({ resources: [P.join('dist', 'cli.js'), P.join('dist', 'index.js'), P.join('dist', 'foo.txt')] })
  expect(await glob('*', { cwd: 'dist', dot: true })).toEqual([
    'cli.js',
    'foo.txt',
    'index.js',
  ])
  await outputFile(P.join('src', 'index.js'), 'foo bar')
  await new Promise(resolve => childProcess.stdout.on('data', data => {
    if (data.toString().includes('Unexpected token, expected ";"')) {
      resolve()
    }
  }))
  await childProcess.kill()
})
