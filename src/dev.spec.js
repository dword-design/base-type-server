import { endent, property } from '@dword-design/functions'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import { outputFile } from 'fs-extra'
import outputFiles from 'output-files'
import pWaitFor from 'p-wait-for'
import P from 'path'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  'build errors': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
            dependencies: {
              [packageName`express`]: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        src: {
          'cli.js': endent`
            #!/usr/bin/env node

            import express from 'express'
            import result from '.'

            express()
              .get('/', (req, res) => res.send({ result }))
              .listen(3000)

          `,
          'index.js': endent`
            export default 1

          `,
        },
      })
      await execaCommand('base prepare')

      const childProcess = execaCommand('base dev')
      try {
        await portReady(3000)
        await outputFile(P.join('src', 'index.js'), 'foo bar')
        await new Promise(resolve =>
          childProcess.stdout.on('data', data => {
            if (
              data
                .toString()
                .includes('Parsing error: Missing semicolon. (1:3)')
            ) {
              resolve()
            }
          })
        )
        childProcess.stdout.removeAllListeners('data')
      } finally {
        await kill(childProcess.pid)
      }
    }),
  'linting errors': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
            dependencies: {
              [packageName`express`]: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        src: {
          'cli.js': endent`
            #!/usr/bin/env node

            import express from 'express'
            import result from '.'

            express()
              .get('/', (req, res) => res.send({ result }))
              .listen(3000)

          `,
          'index.js': endent`
            export default 1

          `,
        },
      })
      await execaCommand('base prepare')

      const childProcess = execaCommand('base dev')
      try {
        await portReady(3000)
        await outputFile(
          P.join('src', 'index.js'),
          endent`
          var foo = 'bar'

        `
        )
        await new Promise(resolve =>
          childProcess.stdout.on('data', data => {
            if (
              data
                .toString()
                .includes("foo' is assigned a value but never used")
            ) {
              resolve()
            }
          })
        )
      } finally {
        await kill(childProcess.pid)
      }
    }),
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
            dependencies: {
              [packageName`express`]: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        src: {
          'cli.js': endent`
            #!/usr/bin/env node

            import express from 'express'
            import result from '.'

            express()
              .get('/', (req, res) => res.send({ result }))
              .listen(3000)

          `,
          'index.js': endent`
            export default 1

          `,
        },
      })
      await execaCommand('base prepare')

      const childProcess = execaCommand('base dev', { stdio: 'inherit' })
      try {
        await portReady(3000)
        expect(
          axios.get('http://localhost:3000') |> await |> property('data.result')
        ).toEqual(1)
        await outputFile(
          P.join('src', 'index.js'),
          endent`
          export default 2

        `
        )
        await pWaitFor(
          async () => {
            try {
              return (
                axios.get('http://localhost:3000')
                |> await
                |> property('data.result')
                |> (result => result === 2)
              )
            } catch {
              return false
            }
          },
          { interval: 300 }
        )
      } finally {
        await kill(childProcess.pid)
      }
    }),
}
