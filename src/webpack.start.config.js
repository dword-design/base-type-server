import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'
import { spawn } from 'child_process'

let serverProcess = undefined

export default webpackMerge(
  baseConfig,
  {
    plugins: [
      {
        apply: compiler => compiler.hooks.afterEmit
          .tap('BaseServerPlugin', () => {
            if (serverProcess !== undefined) {
              serverProcess.kill()
            }
            serverProcess = spawn('node', ['dist/cli.js'], { stdio: 'inherit' })
          }),
      },
    ],
  }
)
