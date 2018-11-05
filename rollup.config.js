import { terser } from "rollup-plugin-terser"

export default {
  name: 'sdk33',
  input: 'src/index.js',
  external: ['axios', 'socket.io-client'],
  output: {
    file: 'dist/sdk.umd.js',
    format: 'umd'
  },
  plugins: [ terser() ]
}