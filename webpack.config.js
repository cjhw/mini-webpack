import { jsonLoader } from './jsonLoader.js'

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
}
