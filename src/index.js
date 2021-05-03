import nodeConfig from '@dword-design/base-config-node'
import { property } from '@dword-design/functions'
import chokidar from 'chokidar'
import debounce from 'debounce'
import execa from 'execa'
import stdEnv from 'std-env'
import kill from 'tree-kill-promise'

let serverProcess

export default {
  ...nodeConfig,
  commands: {
    ...nodeConfig.commands,
    dev: options => {
      options = {
        log: !stdEnv.test,
        resolvePluginsRelativeTo: require.resolve(
          '@dword-design/eslint-config'
        ),
        ...options,
      }

      return chokidar.watch('src').on(
        'all',
        debounce(async () => {
          try {
            console.log('Linting files …')

            const output = { all: '' }
            try {
              output.all +=
                execa(
                  'eslint',
                  [
                    '--fix',
                    '--ext',
                    '.js,.json',
                    '--ignore-path',
                    '.gitignore',
                    '--resolve-plugins-relative-to',
                    options.resolvePluginsRelativeTo,
                    '.',
                  ],
                  options.log ? { stdio: 'inherit' } : { all: true }
                )
                |> await
                |> property('all')
            } catch (error) {
              throw new Error(error.all)
            }
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
      )
    },
    start: () => execa.command('node dist/cli.js', { stdio: 'inherit' }),
  },
  npmPublish: false,
}
