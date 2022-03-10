const vinci = require('../../dist/@youwol/vinci')
const generateRectangle = require('../generateGrid')
const io    = require('@youwol/io')
const math  = require('@youwol/math')
const fs    = require('fs')

const name = 'horizontal'

// const pts = new Array(100).fill(undefined).map( (v,i) => [i,i])
// console.log('nb points:', pts.length)
// const points = []
// pts.forEach( p => points.push(...p) )

const buffer = fs.readFileSync('/Users/fmaerten/data/vinci/dxf/'+name+'.dxf', 'utf8')
const segments = vinci.dxfDecoder(buffer)
const fault = new vinci.Fault()
segments.forEach( s => {
    fault.addElement( new vinci.Segment([s[0], s[1]], [s[2], s[3]]) )
})
fault.bcType  = ['t', 't']
fault.burgers = [0, 0]

const model = new vinci.Model()
model.addFault(fault)
model.addRemote( new vinci.RemoteStress([0, 0, -1]) )
console.log('nb dofs:', model.dof)

console.log('Solving the system...')
const solver = new vinci.Seidel({
    model,
    maxIter: 2000
})
//solver.iterationCB = (convergence, iteration) => console.log(iteration, convergence)
solver.run()

console.log('Post processing...')
const solution = new vinci.Solution(model)

const bounds = model.bounds
const L = Math.max(bounds.xLength, bounds.yLength) * 3
const grid = generateRectangle({
    a: L, b: L,
    na:100, nb: 100,
    center: [...bounds.center, 0],
    badFct: (x,y) => model.tooClose([x,y], 1) // 0.1 for enEchelon
})

grid.series['U'] = solution.displ(grid.series.positions)
grid.series['S'] = solution.stress(grid.series.positions)

console.log( math.minMax(grid.series.U) )
console.log( math.minMax(grid.series.S) )

fs.writeFileSync('/Users/fmaerten/data/vinci/dxf/grid.ts', io.encodeGocadTS(grid), 'utf8', err => {})
