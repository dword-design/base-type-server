import webpackMerge from 'webpack-merge'
import { getWebpackConfig as getLibConfig } from '@dword-design/base-type-lib'
import fs from 'fs-extra'
import HtmlWebpackPlugin from 'html-webpack-plugin'

export default args => webpackMerge(
  getLibConfig(args),
  {
    entry: {
      cli: './src/cli.js',
    },
    plugins: [
      ...fs.existsSync('index.html')
        ? [new HtmlWebpackPlugin({
          template : 'index.html',
          filename : 'index.html',
          hash     : false,
          inject   : false,
        })]
        : [],
    ],
  },
)
