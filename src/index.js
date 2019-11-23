import nodeEnv from 'node-env'
import { spawn } from 'child_process'
import { base, babelConfigFilename, eslintConfigFilename } from '@dword-design/base'
import { remove } from 'fs'
import resolveBin from 'resolve-bin'
import chokidar from 'chokidar'
import debounce from 'debounce'

let serverProcess = undefined

const prepare = async () => {
  await remove('dist')
  await spawn(
    resolveBin.sync('eslint'),
    ['--config', require.resolve(eslintConfigFilename), '--ignore-path', '.gitignore', '.'],
    { stdio: 'inherit' }
  )
  await spawn(
    resolveBin.sync('@babel/cli', { executable: 'babel' }),
    ['--out-dir', 'dist', '--config-file', require.resolve(babelConfigFilename), '--copy-files', 'src'],
    { stdio: 'inherit' }
  )
}

export default () => base({
  prepare,
  start: async () => {
    if (nodeEnv === 'production') {
      await prepare()
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
                await prepare()
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
