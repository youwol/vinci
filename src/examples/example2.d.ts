/**
 * Two en -echelon cracks with imposed burger's vectors
 *
 * ```js
 * const vinci = require('@youwol/vinci')
 * const geom  = require('@youwol/geometry')
 * const io    = require('@youwol/io')
 * const math  = require('@youwol/math')
 * const fs    = require('fs')
 *
 * // -----------------------------------------------
 *
 * const model = new vinci.Model()
 *
 * const builder = new vinci.FaultBuilder()
 *
 * builder
 *      // First crack
 *      .setPoints([-1,-1, 1,1, 2, 1])
 *      .subdivide(30)
 *      .setBurger([0,1])
 *      .setBcType(vinci.BC.bb)
 *      .addTo(model)
 *      // Second crack
 *      .reset()
 *      .setPoints([1,0.5, 2,0.5, 4, 2.5])
 *      .subdivide(30)
 *      .setBurger([0,1])
 *      .setBcType(vinci.BC.bb)
 *      .addTo(model)
 *
 * const bounds = model.bounds
 * const grid = geom.generateRectangle({
 *      a : bounds.xLength*2,
 *      b : bounds.yLength*2,
 *      na: 150,
 *      nb: 150,
 *      center: [...bounds.center, 0]
 * })
 *
 * const solution = new vinci.Solution(model)
 * grid.series['U'] = solution.displ(grid.series.positions)
 * grid.series['S'] = solution.stress(grid.series.positions)
 *
 * fs.writeFileSync('grid.ts', io.encodeGocadTS(grid), 'utf8', err => {})
 * ```
 */
export namespace Example_2 {}
