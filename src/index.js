import nodeEnv from '@dword-design/node-env'
import { spawn } from 'child-process-promise'
import { run, watch } from '@dword-design/webpack-runner'

const build = {
  name: 'build',
  handler: () => run(require('./webpack.config').default),
}

export const commands = [
  build,
  {
    name: 'start',
    handler: () => nodeEnv === 'production'
      ? Promise.resolve()
        .then(build.handler)
        .then(() => spawn('forever', ['restart', 'dist/server.js'], { stdio: 'inherit' }))
        .catch(error => {
          if (error.name === 'ChildProcessError') {
            return spawn('forever', ['start', 'dist/server.js'], { stdio: 'inherit' })
          } else {
            throw(error)
          }
        })
      : watch(require('./webpack.start.config').default),
  },
]
