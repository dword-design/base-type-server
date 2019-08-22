import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'
import { spawn } from 'child-process-promise'
import resolveBin from 'resolve-bin'

export default webpackMerge(
  baseConfig,
  {
    plugins: [
      {
        apply: compiler => compiler.hooks.afterEmit
          .tap('BaseServerPlugin', () => spawn(resolveBin.sync('nodemon'), ['dist/cli.js', '--watch', 'dist'], { stdio: 'inherit' })),
      },
    ],
  }
)
