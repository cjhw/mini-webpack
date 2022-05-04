export class ChangeOutputPath {
  apply(hooks) {
    hooks.emitFile.tap('changeOutputPath', (context) => {
      console.log('------changeOutputPath')
      context.ChangeOutputPath('./build/caicai.js')
    })
  }
}
