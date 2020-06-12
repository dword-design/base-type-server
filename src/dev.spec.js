import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import P from 'path'
import outputFiles from 'output-files'
import { endent, property } from '@dword-design/functions'
import { outputFile } from 'fs-extra'
import kill from 'tree-kill-promise'
import axios from 'axios'
import portReady from 'port-ready'
import getPackageName from 'get-package-name'
import pWaitFor from 'p-wait-for'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
            dependencies: {
              [getPackageName(require.resolve('express'))]: '^1.0.0',
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
      await execa.command('base prepare')
      const childProcess = execa.command('base dev')
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
  'build errors': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
            dependencies: {
              [getPackageName(require.resolve('express'))]: '^1.0.0',
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
      await execa.command('base prepare')
      const childProcess = execa.command('base dev')
      try {
        await portReady(3000)
        await outputFile(P.join('src', 'index.js'), 'foo bar')
        await new Promise(resolve =>
          childProcess.stdout.on('data', data => {
            if (data.toString().includes('Unexpected token, expected ";"')) {
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
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
            dependencies: {
              [getPackageName(require.resolve('express'))]: '^1.0.0',
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
      await execa.command('base prepare')
      const childProcess = execa.command('base dev')
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
}
