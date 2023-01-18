/**
 * Minimal example
 *
 * ```js
 * const vinci = require('@youwol/vinci')
 *
 * const fault = new vinci.Fault()
 * fault.addElement( new vinci.Segment([0,0], [1,1]) )
 * fault.bcType = vinci.BC.bb
 * fault.burgers = [0,1]
 *
 * const model = new vinci.Model()
 * model.addFault(fault)
 *
 * const solution = new vinci.Solution(model)
 * const pts = new Array(100).fill(0).map( _ => Math.random()*3)
 * console.log( solution.stress(grid.series.positions) )
 * ```
 */
export namespace Example_1 { }
