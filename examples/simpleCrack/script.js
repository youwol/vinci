const vinci = require('../../dist/@youwol/vinci')
const io    = require('@youwol/io')
const math  = require('@youwol/math')
const fs    = require('fs')
const generateRectangle = require('../generateGrid')

const path = '/Users/fmaerten/data/vinci/crack/'


function parallel() {
    const model   = new vinci.Model()
    const builder = new vinci.FaultBuilder()

    builder
        .setPoints(new Array(20).fill(0).map( (v,i) => i ))
        .setBurger([1,0])
        .setBcTypes(['b', 'b'])
    model.addFault(builder.fault)

    builder
        .reset()
        .setPoints(new Array(20).fill(0).map( (v,i) => i%2===0?i+20:i+10 ))
        .setBcTypes(['b', 'b'])
        .setBurger([1,0])
    model.addFault(builder.fault)

    return model
}

function enEchelon() {
    const model   = new vinci.Model()
    const builder = new vinci.FaultBuilder()

    builder
        .setPoints([-1,-1, 1,1, 2, 1])
        .subdivide(30)
        .setBurger([0,1])
        .setBcTypes(['b', 'b'])
        .addTo(model)
        .reset()
        .setPoints([1,0.5, 2,0.5, 4, 2.5])
        .subdivide(30)
        .setBurger([0,1])
        .setBcType(vinci.BC.bb)
        .addTo(model)

    return model
}

function simpleCrack() {
    const model   = new vinci.Model()
    const builder = new vinci.FaultBuilder()

    const n = 40
    const x = new Array(n).fill(0).map( (v,i) => i%2===0 ? i/n/2 : 0 )
    // // const x = [0,0, 1,0]

    builder
        .setPoints(x)
        .setBcTypes(['b', 'b'])
        .setBurger([1,0])
    model.addFault(builder.fault)

    return model
}

function inclinedCrack() {
    const fault = new vinci.Fault([0,0, 1,1]) // one segment
    fault.bcType  = ['t','t']
    fault.burgers = [0,1]

    const model = new vinci.Model()
    model.addFault(fault)

    return model
}

// -----------------------------------------------

const model = inclinedCrack()
console.log('nb segments', model.faults.reduce( (cur, f) => cur + f.elements.length, 0 ))

const solution = new vinci.Solution(model)

const bounds = model.bounds
const L = Math.max(bounds.xLength, bounds.yLength) * 3
const grid = generateRectangle({
    a: L, b: L,
    na:300, nb: 300,
    center: [...bounds.center, 0],
    badFct: (x,y) => model.tooClose([x,y], 0.1) // 0.1 for enEchelon
})

grid.series['U'] = solution.displ(grid.series.positions)
grid.series['S'] = solution.stress(grid.series.positions)

console.log( math.minMax(grid.series.U) )
console.log( math.minMax(grid.series.S) )

fs.writeFileSync(path+'grid.ts', io.encodeGocadTS(grid), 'utf8', err => {})
