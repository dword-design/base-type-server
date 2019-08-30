import webpackMerge from 'webpack-merge'
import getWebpackConfig from './get-webpack-config'
import { spawn } from 'child_process'

let serverProcess = undefined

export default args => webpackMerge(
  getWebpackConfig(args),
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
