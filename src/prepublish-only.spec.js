import { Base } from '@dword-design/base'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import outputFiles from 'output-files'
import P from 'path'
import fs from 'fs-extra'

import config from './index.js'

export default tester(
  {
    async valid() {
      await outputFiles({
        'src/index.js': 'export default 1 |> x => x * 2',
      })

      const base = new Base({ name: P.resolve('..', 'src', 'index.js') })
      await base.prepare()
      await config.commands.prepublishOnly()
      expect(await fs.readFile(P.join('dist', 'index.js'), 'utf8')).toMatchSnapshot(
        this
      )
    },
  },
  [testerPluginTmpDir()]
)
