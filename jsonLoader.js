export function jsonLoader(source) {
  console.log('jsonLoader______________', source)
  this.addDeps('jsonLoader')
  return `export default ${JSON.stringify(source)}`
}
