import nodeEnv from '@dword-design/node-env'
import { spawn } from 'child-process-promise'
import { run, watch } from '@dword-design/webpack-runner'
import getWebpackConfig from './get-webpack-config'
import getWebpackStartConfig from './get-webpack-start-config'

const build = args => run(getWebpackConfig(args))

export const commands = [
  {
    name: 'build',
    handler: build,
  },
  {
    name: 'start',
    handler: args => nodeEnv === 'production'
      ? Promise.resolve()
        .then(() => build(args))
        .then(() => spawn('forever', ['restart', 'dist/server.js'], { stdio: 'inherit' }))
        .catch(error => {
          if (error.name === 'ChildProcessError') {
            return spawn('forever', ['start', 'dist/server.js'], { stdio: 'inherit' })
          } else {
            throw(error)
          }
        })
      : watch(getWebpackStartConfig(args)),
  },
]
