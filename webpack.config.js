import { jsonLoader } from './jsonLoader.js'
import { ChangeOutputPath } from './ChangeOutputPath.js'

export default {
  //...
  module: {
    rules: [
      {
        test: /\.json$/,
        use: [jsonLoader],
      },
    ],
  },
  plugins: [new ChangeOutputPath()],
}
