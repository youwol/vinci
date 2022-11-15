vinci     = globalThis['@youwol/vinci']
dataframe = globalThis['@youwol/dataframe']

// -----------------------------------------------------------------------------------------

// TODO: use array of buildFault
//
const models = new Map
models.set("Kink",          buildFault([0,0,0, 1,1,0, 2,1,0, 3,1,0, 4,2,0]) )
models.set("Inclined",      buildFault([0,0,0, 1,1,0, 2,2,0]) )
models.set("Horizontal",    buildFault(new Array(15).fill(0).map( (v,i) => i%3===0?i/3:0)) )
models.set("Vertical",      buildFault(new Array(15).fill(0).map( (v,i) => i%3===0?0:i/3)) )
models.set("Wavy",          buildFault([0,0,0, 1,1,0, 2,0,0, 3,1,0, 4,0,0]) )
const s = 0.6
models.set("Spacing", [
    buildFault([0,0,0, 1,0,0, 2,0,0]),
    buildFault([0,-s,0, 1,-s,0, 2,-s,0]),
    buildFault([0,-2*s,0, 1,-2*s,0, 2,-2*s,0]),
    buildFault([0,-3*s,0, 1,-3*s,0, 2,-3*s,0]),
    buildFault([0,-4*s,0, 1,-4*s,0, 2,-4*s,0])
])

{
    const a = []
    for (let i=0; i<360; i+= 5) {
        a.push(10*Math.cos(i*Math.PI/180), 10*Math.sin(i*Math.PI/180), 0)
    }
    // a.push(10,0,0)
    models.set("Circle", buildFault(a) )
}

// -----------------------------------------------------------------------------------------

function buildFault(points) {
    const positions = dataframe.Serie.create( {array: points, itemSize: 3})
    const idx = []
    for (let i=0; i<positions.count-1; ++i) {
        idx.push(i, i+1)
    }
    return dataframe.DataFrame.create({
        series: {
            positions,
            indices: dataframe.Serie.create( {array: idx, itemSize: 2})
        }
    })
}

function addFaultToModel(fault, vmodel, bcType) {
    function add(f) {
        const builder = new vinci.FaultBuilder()
        f.series.positions.forEach( p => builder.addPoint(p) )
        faults.push(f)
        builder
            .setBcType(bcType)
            .addTo(vmodel)
    }
    if (Array.isArray(fault)) {
        fault.forEach( f => add(f) )
    }
    else {
        add(fault)
    }
}

function generateGrid(vmodel) {
    const NB = model.gridSampling
    const bounds = vmodel.bounds
    const L = Math.max(bounds.xLength, bounds.yLength) * model.gridExtend
    const df = generateRectangle({
        a: L, b: L,
        na: NB, nb: NB,
        center: [...bounds.center, 0],
        badFct: (x,y) => vmodel.tooClose([x,y], 0.1) // 0.1 for enEchelon
    })

    const positions = dataframe.Serie.create({
        array   : dataframe.createTyped(Float32Array, df.series.positions.array, false),
        itemSize: 3
    })

    return dataframe.DataFrame.create({
        series: {
            positions,
            indices: df.series.indices.array
        }
    })
}

function runModel(name, isDataframe=false) {
    faults = []
    vmodel = new vinci.Model()

    if (isDataframe) {
        addFaultToModel(name, vmodel, bc)
    }
    else {
        const f = models.get(name)
	    addFaultToModel(f, vmodel, bc)
    }
    

    console.log('nb dofs:', vmodel.dof)

    const remote = new vinci.RotationalStress(S1, S2, theta)
    vmodel.addRemote( remote )

    solver = new vinci.Seidel({
        model: vmodel,
        maxIter: 100
    })

    // solver.iterationCB = (convergence, iteration) => console.log(iteration, convergence)
    // solver.warningCB   = msg => console.log("WARNING:", msg)
    solver.run()

    const solution = new vinci.Solution(vmodel)

    const grid = generateGrid(vmodel)
    grid.series['U'] = solution.displ (grid.series.positions)
    grid.series['S'] = solution.stress(grid.series.positions)

    return grid
}

function regenerateModel() {
    let grid = undefined
    if (curDfs === undefined) {
        grid = runModel(curModel)
    }
    else {
        grid = runModel(curDfs, true)
    }
    doSurface(grid, surfaceInfo)
    doLines(faults, lineInfo)
}

bc = 'tt'

faults = []

vmodel = new vinci.Model()

solver = new vinci.Seidel({
    vmodel,
    maxIter: 100
})


function generateRectangle({a, b, na, nb, center=[0,0,0], badFct}) {
    const add = (x, y) => nodes.push(x+center[0]-a/2, y+center[1]-b/2, center[2])
    const nodes = []
    const aa = 1/(na-1)
    const bb = 1/(nb-1)
    for (let i=0; i<na; ++i) {
        for (let j=0; j<nb; ++j) {
            const x = a*i*aa + center[0] - a/2
            const y = b*j*bb + center[1]-b/2
            if (badFct && badFct(x,y)===false) {
                nodes.push(x, y, center[2])
            }
            else {
                //console.log('skipping one point')
            }
        }
    }

    return geom.triangulate( dataframe.Serie.create({array: nodes, itemSize: 3}) )
}