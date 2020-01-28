import nodeEnv from 'better-node-env'
import { spawn } from 'child-process-promise'
import { outputFile, remove } from 'fs-extra'
import chokidar from 'chokidar'
import debounce from 'debounce'
import getPackageName from 'get-package-name'
import kill from 'tree-kill'

let serverProcess = undefined

const lint = async () => {
  await outputFile('.eslintrc.json', JSON.stringify({ extends: getPackageName(require.resolve('@dword-design/eslint-config')) }, undefined, 2) + '\n')
  await spawn('eslint', ['--ignore-path', '.gitignore', '.'], { stdio: 'inherit' })
}

const build = async () => {
  await lint()
  await remove('dist')
  await spawn('babel', ['--out-dir', 'dist', '--copy-files', '--config-file', getPackageName(require.resolve('@dword-design/babel-config')), 'src'], { stdio: 'inherit' })
}

export default {
  build,
  gitignore: ['/.eslintrc.json'],
  lint,
  start: async () => {
    if (nodeEnv === 'production') {
      await build()
      try {
        await spawn('forever', ['restart', 'dist/cli.js'], { stdio: 'inherit' })
      } catch (error) {
        if (error.name === 'ChildProcessError') {
          return spawn('forever', ['start', 'dist/cli.js'], { stdio: 'inherit' })
        } else {
          throw(error)
        }
      }
    } else {
      return chokidar
        .watch('src')
        .on(
          'all',
          debounce(
            async () => {
              try {
                await lint()
                if (serverProcess !== undefined) {
                  kill(serverProcess.pid)
                }
                console.log('Starting server …')
                serverProcess = spawn(
                  'babel-node',
                  ['--config-file', getPackageName(require.resolve('@dword-design/babel-config')), 'src/cli.js'],
                  { stdio: 'inherit' },
                )
                  .catch(error => {
                    if (error.code !== null) {
                      throw error
                    }
                  })
                  .childProcess
              } catch ({ code, message }) {
                if (code !== null) {
                  console.log(message)
                }
              }
            },
            200
          )
        )
    }
  },
}
