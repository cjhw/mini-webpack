import fs from 'fs'
import path from 'path'
import ejs from 'ejs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import { transformFromAst } from 'babel-core'
let id = 0

function createAsset(filePath) {
  // 1. 获取文件的内容
  // ast -> 抽象语法树
  const source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  })
  // console.log(source)
  // 2. 获取依赖关系
  const ast = parser.parse(source, {
    sourceType: 'module',
  })
  // console.log(ast)
  const deps = []
  traverse.default(ast, {
    ImportDeclaration({ node }) {
      // console.log('import_____________')
      // console.log(node.source.value)
      deps.push(node.source.value)
    },
  })
  // esm转换为cjs的代码
  const { code } = transformFromAst(ast, null, {
    presets: ['env'],
  })

  // console.log(code)
  return {
    filePath,
    code,
    deps,
    mapping: {},
    id: id++,
  }
}

// const asset = createAsset()
// console.log(asset)
function createGraph() {
  const mainAsset = createAsset('./example/main.js')
  const queue = [mainAsset]
  for (const asset of queue) {
    asset.deps.forEach((relactivePath) => {
      const child = createAsset(path.resolve('./example', relactivePath))
      asset.mapping[relactivePath] = child.id
      queue.push(child)
    })
  }
  return queue
}
const graph = createGraph()
console.log(graph)

function build(graph) {
  const template = fs.readFileSync('./bundle.ejs', { encoding: 'utf-8' })

  const data = graph.map((asset) => {
    const { id, code, mapping } = asset
    return {
      id, code, mapping
    }
  })
  console.log(data)
  const code = ejs.render(template, { data })
  fs.writeFileSync('./dist/bundle.js', code)
  console.log(code)
}

build(graph)
