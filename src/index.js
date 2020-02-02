import { spawn } from 'child-process-promise'
import chokidar from 'chokidar'
import debounce from 'debounce'
import getPackageName from 'get-package-name'
import kill from 'tree-kill'
import nodeConfig from '@dword-design/base-config-node'

let serverProcess = undefined

export default {
  gitignore: ['/.eslintrc.json'],
  commands: {
    ...nodeConfig.commands,
    dev: () => chokidar
      .watch('src')
      .on(
        'all',
        debounce(
          async () => {
            try {
              await nodeConfig.test()
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
          200,
        ),
      ),
    start: async () => {
      await nodeConfig.commands.prepublishOnly()
      try {
        await spawn('forever', ['restart', 'dist/cli.js'], { stdio: 'inherit' })
      } catch (error) {
        if (error.name === 'ChildProcessError') {
          return spawn('forever', ['start', 'dist/cli.js'], { stdio: 'inherit' })
        } else {
          throw error
        }
      }
    },
  },
}
