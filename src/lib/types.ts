/**
 * @category Math
 */
export type Vector = [number, number]

/**
 * @category Math
 */
export type Point = [number, number]

/**
 * Displ in 2D is defined as `[ux, uy]`
 * @category Math
 */
export type Displ = [number, number]

/**
 * Traction in 2D is defined as `[ts, tn]` when `s` and `n` stand for shear
 * and normal, respectively
 * @category Math
 */
export type Traction = [number, number]

export type Normal = [number, number]

/**
 * Stress in 2D is defined as `[xx, xy, yy]`
 * @category Math
 */
export type Stress = [number, number, number]

/**
 * @category Math
 */
export type Vectord = number[]

/**
 * The displacement coefficient matrix
 * @category Math
 */
export type DisplCoeff = [[number, number], [number, number]]

/**
 * The traction coefficient matrix
 * @category Math
 */
export type TractionCoeff = [[number, number], [number, number]]

/**
 * The stress coefficient matrix
 * @category Math
 */
export type StressCoeff = [[number, number], [number, number], [number, number]]

export type Matrix = Array<Array<number>>
