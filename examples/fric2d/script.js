const vinci = require('../../dist/@youwol/vinci')

const model = new vinci.Model()

// const fault   = new vinci.Fault([0,0, 1,1]) // one segment inclined at 45°
// fault.bcType  = ['t','t']
// fault.burgers = [0, 1]
// model.addFault(fault)

const builder = new vinci.FaultBuilder()
builder
     .addPoint([0,0])
     .addPoint([1,1])
    //  .subdivide(2)
     .setBcType('tt')
     .addTo(model)

const fault = builder.fault
fault.elements.forEach( s => {
    console.log(s.begin, s.end)
})


const remote = new vinci.UserRemoteStress( p => [0, 0, p[1]*9.81])
model.addRemote(remote)

const solver = new vinci.Seidel( {model, maxIter: 1000} )
solver.iterationCB = (convergence, iteration) => console.log('iter: ', iteration, convergence)
solver.run()

const solution = new vinci.Solution(model)
console.log('Burgers', solution.burgers())