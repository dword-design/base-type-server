import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'
import { spawn } from 'child-process-promise'

export default webpackMerge(
  baseConfig,
  {
    plugins: [
      {
        apply: compiler => compiler.hooks.afterEmit
          .tap('BaseServerPlugin', () => spawn('nodemon', ['dist/cli.js', 'watch', 'dist'])),
      },
    ],
  }
)
