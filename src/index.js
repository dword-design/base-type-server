import getNodeConfig from '@dword-design/base-config-node'
import { execaCommand } from 'execa'

import dev from './dev.js'

export default config => {
  const nodeConfig = getNodeConfig(config)
  return {
    ...nodeConfig,
    commands: {
      ...nodeConfig.commands,
      dev,
      start: () => execaCommand('node dist/cli.js', { stdio: 'inherit' }),
    },
    npmPublish: false,
  }
}