import nodeEnv from 'node-env'
import { spawn } from 'child_process'
import { outputFile, remove } from 'fs'
import chokidar from 'chokidar'
import debounce from 'debounce'
import getPackageName from 'get-package-name'

let serverProcess = undefined

const lint = async () => {
  await outputFile('.eslintrc.json', JSON.stringify({ extends: getPackageName(require.resolve('@dword-design/eslint-config')) }, undefined, 2) + '\n')
  await spawn('eslint', ['--ignore-path', '.gitignore', '.'], { stdio: 'inherit' })
}

const build = async () => {
  await lint()
  await remove('dist')
  await spawn('babel', ['--out-dir', 'dist', '--copy-files', 'src'], { stdio: 'inherit' })
}

export default {
  build,
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
                await build()
                if (serverProcess !== undefined) {
                  serverProcess.kill()
                }
                serverProcess = spawn('node', ['dist/cli.js'], { stdio: 'inherit' }).childProcess
              } catch (error) {
                if (error.name !== 'ChildProcessError') {
                  console.log(error)
                }
              }
            },
            200
          )
        )
    }
  },
}
