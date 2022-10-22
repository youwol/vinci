const vinci = require('../../dist/@youwol/vinci')
const generateRectangle = require('../generateGrid')
const io    = require('@youwol/io')
const math  = require('@youwol/math')
const fs    = require('fs')

const model = new vinci.Model()

// const name = 'horizontal'
// const buffer = fs.readFileSync('/Users/fmaerten/data/vinci/dxf/'+name+'.dxf', 'utf8')
// const segments = vinci.dxfDecoder(buffer)
// const fault = new vinci.Fault()
// segments.forEach( s => {
//     fault.addElement( new vinci.Segment([s[0], s[1]], [s[2], s[3]]) )
// })
// fault.bcType  = ['t', 't']
// fault.burgers = [0, 0]
// model.addFault(fault)

const builder = new vinci.FaultBuilder()
builder
     .addPoint([0,0])
     .addPoint([1,1])
     .subdivide(10)
     .setBcType('tt')
     .setBurger([0,0])
     .addTo(model)

const remote = new vinci.RemoteStress([0, 0, 1])
model.addRemote( remote )
console.log('nb dofs:', model.dof)

const solution = new vinci.Solution(model)

console.log('Solving the system...')
const solver = new vinci.Seidel({
    model,
    maxIter: 1
})
//solver.iterationCB = (convergence, iteration) => console.log(iteration, convergence)
solver.run()

// fault.elements.forEach( seg => {
//     console.log( seg )
// })

// console.log('Burgers', solution.burgers())

console.log('Post processing...')

const NB = 100
const bounds = model.bounds
const L = Math.max(bounds.xLength, bounds.yLength) * 3
const grid = generateRectangle({
    a: L, b: L,
    na: NB, nb: NB,
    center: [...bounds.center, 0],
    badFct: (x,y) => model.tooClose([x,y], 0.1) // 0.1 for enEchelon
})

grid.series['U'] = solution.displ(grid.series.positions)
grid.series['S'] = solution.stress(grid.series.positions)

// console.log( math.minMax(grid.series.U) )
// console.log( math.minMax(grid.series.S) )

fs.writeFileSync('/Users/fmaerten/data/vinci/dxf/grid.ts', io.encodeGocadTS(grid), 'utf8', err => {})
