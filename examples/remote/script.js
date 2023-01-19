const vinci = require('../../dist/@youwol/vinci')
const io = require('@youwol/io')
const dataframe = require('@youwol/dataframe')
const fs = require('fs')
const generateRectangle = require('../generateGrid')

const faults = []
const model = new vinci.Model()

function buildFault(points) {
    const positions = dataframe.Serie.create({ array: points, itemSize: 3 })
    const idx = []
    for (let i = 0; i < positions.count - 1; ++i) {
        idx.push(i, i + 1)
    }
    return dataframe.DataFrame.create({
        series: {
            positions,
            indices: dataframe.Serie.create({ array: idx, itemSize: 2 }),
        },
    })
}

function addFaultToModel(fault, model, bcType) {
    const builder = new vinci.FaultBuilder(model)
    fault.series.positions.forEach((p) => builder.addPoint(p))
    faults.push(fault)
    builder
        .setBcType(bcType)
        // .setBurger([0,0])
        // .addTic( new vinci.UserTic( v => [v[0], v[1]<0 ? 0 : v[1]] ) )
        .addToModel()
}

// addFaultToModel(buildFault(new Array(15).fill(0).map( (v,i) => i%3===0?i/3:0)), model, 'tt')
addFaultToModel(
    buildFault([0, 0, 0, 1, 1, 0, 2, 1, 0, 3, 1, 0, 4, 2, 0]),
    model,
    'bt',
)
// addFaultToModel(buildFault([0,0,0, 1,1,0, 2,2,0]), model, 'tt')
// addFaultToModel(buildFault([0,-1,0, 1,0,0, 2,1,0]), model, 'tt')

const remote = new vinci.RemoteStress([0, -1, 0])
model.addRemote(remote)
console.log('nb dofs:', model.dof)

const solution = new vinci.Solution(model)

const solver = new vinci.Seidel({
    model,
    maxIter: 100,
})
solver.iterationCB = (convergence, iteration) =>
    console.log(iteration, convergence)
solver.warningCB = (msg) => console.log('WARNING:', msg)
solver.run()

// console.log('Post processing...')

const NB = 100
const bounds = model.bounds
const L = Math.max(bounds.xLength, bounds.yLength) * 1.5
const grid = generateRectangle({
    a: L,
    b: L,
    na: NB,
    nb: NB,
    center: [...bounds.center, 0],
    badFct: (x, y) => model.tooClose([x, y], 0.1), // 0.1 for enEchelon
})

grid.series['U'] = solution.displ(grid.series.positions)
grid.series['S'] = solution.stress(grid.series.positions)

fs.writeFileSync(
    '/Users/fmaerten/data/vinci/grid/remote.ts',
    io.encodeGocadTS(grid),
    'utf8',
    () => {},
)
fs.writeFileSync(
    '/Users/fmaerten/data/vinci/pl/remote.pl',
    io.encodeGocadPL(faults),
    'utf8',
    () => {},
)

/*
const name = 'horizontal'
const buffer = fs.readFileSync('/Users/fmaerten/data/vinci/dxf/'+name+'.dxf', 'utf8')
const segments = vinci.dxfDecoder(buffer)
const fault = new vinci.Fault()
segments.forEach( s => {
    fault.addElement( new vinci.Segment([s[0], s[1]], [s[2], s[3]]) )
})
fault.bcType  = ['t', 't']
fault.burgers = [0, 0]
model.addFault(fault)
*/
