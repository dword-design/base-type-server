import nodeConfig from '@dword-design/base-config-node'
import chokidar from 'chokidar'
import debounce from 'debounce'
import execa from 'execa'
import kill from 'tree-kill-promise'

let serverProcess

export default {
  ...nodeConfig,
  commands: {
    ...nodeConfig.commands,
    dev: () =>
      chokidar.watch('src').on(
        'all',
        debounce(async () => {
          try {
            console.log('Linting files …')
            await nodeConfig.lint()
            console.log('Starting server …')
            if (serverProcess) {
              await kill(serverProcess.pid)
            }
            serverProcess = execa.command('babel-node src/cli.js', {
              stdio: 'inherit',
            })
            console.log('Server is up and running.')
          } catch (error) {
            console.log(error.message)
          }
        }, 200)
      ),
    start: () => execa.command('node dist/cli.js', { stdio: 'inherit' }),
  },
  npmPublish: false,
}
