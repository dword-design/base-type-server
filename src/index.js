const libConfig = require('@dword-design/base-type-lib')
const nodeEnv = require('@dword-design/node-env')
const { spawn } = require('child-process-promise')
const { find } = require('lodash')

module.exports = {
  ...libConfig,
  commands: libConfig.commands
    .filter(({ name }) => name !== 'publish')
    .map(command => command.name == 'start'
      ? {
        name: 'start',
        handler: () => nodeEnv === 'production'
          ? Promise.resolve()
            .then(find(libConfig.commands, { name: 'build' }).handler)
            .then(() => spawn('forever', ['restart', 'dist/index.js'], { stdio: 'inherit' }))
            .catch(error => {
              if (error.name === 'ChildProcessError') {
                return spawn('forever', ['start', 'dist/index.js'], { stdio: 'inherit' })
              } else {
                throw(error)
              }
            })
          : command.handler(),
      }
      : command
    ),
}
