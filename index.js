import fs from 'fs'
import path from 'path'
import ejs from 'ejs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import { transformFromAst } from 'babel-core'
let id = 0
import webpackConfig from './webpack.config.js'
import { SyncHook } from 'tapable'

const hooks = {
  emitFile: new SyncHook(['context']),
}

function createAsset(filePath) {
  // 1. 获取文件的内容
  // ast -> 抽象语法树
  let source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  })

  // initLoader
  const loaders = webpackConfig.module.rules
  const loaderContext = {
    addDeps(dep) {
      console.log('addDeps', dep)
    },
  }
  loaders.forEach(({ test, use }) => {
    if (test.test(filePath)) {
      if (Array.isArray(use)) {
        use.reverse()
        use.forEach((fn) => {
          source = fn.call(loaderContext, source)
        })
      } else {
        source = use(source)
      }
    }
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

function initPlugins() {
  const plugins = webpackConfig.plugins
  plugins.forEach((plugin) => {
    plugin.apply(hooks)
  })
}
initPlugins()

const graph = createGraph()
// console.log(graph)

function build(graph) {
  const template = fs.readFileSync('./bundle.ejs', { encoding: 'utf-8' })

  const data = graph.map((asset) => {
    const { id, code, mapping } = asset
    return {
      id,
      code,
      mapping,
    }
  })
  // console.log(data)
  const code = ejs.render(template, { data })

  let outputPath = './build/bundle.js'
  const context = {
    ChangeOutputPath(path) {
      outputPath = path
    },
  }
  hooks.emitFile.call(context)
  fs.writeFileSync(outputPath, code)
  // console.log(code)
}

build(graph)
