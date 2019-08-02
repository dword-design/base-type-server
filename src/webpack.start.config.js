import webpackMerge from 'webpack-merge'
import baseConfig from './webpack.config'

export default webpackMerge(
  baseConfig,
  {
    plugins: [
      {
        apply: compiler => compiler.hooks.afterEmit
          .tap('BaseServerPlugin', () => require('nodemon')({ script: 'dist/cli.js', watch: ['dist'] })),
      },
    ],
  }
)
