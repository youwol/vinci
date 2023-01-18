import { Fault, Model, RemoteStress, Segment, Seidel } from '..'

/* eslint jest/expect-expect: off -- work in progress */

test('construction', () => {
    const model = new Model()
    const fault = new Fault()
    fault.addElement(new Segment([0, 0], [1, 1]))
    model.addFault(fault)
})

test('solver', () => {
    const fault = new Fault([0, 0, 1, 1, 2, 2])
    fault.bcType = ['t', 't']
    fault.burgers = [0, 0]

    console.log(fault.burgers)

    const model = new Model()
    model.addFault(fault)
    model.addRemote(new RemoteStress([1, 0, 2]))

    const solver = new Seidel({ model })
    solver.iterationCB = (convergence, iteration) =>
        console.log(iteration, convergence)
    solver.run()

    console.log(fault.burgers)
})
