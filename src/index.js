import nodeEnv from 'node-env'
import { spawn } from 'child_process'
import { base, babelConfigFilename, eslintConfigFilename } from '@dword-design/base'
import { remove } from 'fs'
import chokidar from 'chokidar'
import debounce from 'debounce'

let serverProcess = undefined

const build = async () => {
  await remove('dist')
  await spawn('eslint', ['--config', require.resolve(eslintConfigFilename), '--ignore-path', '.gitignore', '.'], { stdio: 'inherit' })
  await spawn('babel', ['--out-dir', 'dist', '--config-file', require.resolve(babelConfigFilename), '--copy-files', 'src'], { stdio: 'inherit' })
}

export default () => base({
  build,
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
})
