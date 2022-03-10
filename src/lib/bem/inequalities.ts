import { Vector, Displ, Traction } from "../types"

// -----------------------------------------------

/**
 * Interface for inequality constraint (in traction or displacement)
 * @see [[Tic]]
 * @see [[Dic]]
 * @see [[UserTic]]
 * @see [[UserDic]]
 * @category Inequality
 */
export interface Inequality {
    do(enter: Vector): Vector
}

/**
 * Callback for inequality constraint in traction or displacement
 * @see [[UserTic]]
 * @see [[UserDic]]
 * @category Inequality
 */
 export type InequalityCB = (vector: Vector) => Vector


// -----------------------------------------------

/**
 * Base class for all inequality constraint in displacement
 * @category Inequality
 */
export abstract class Tic implements Inequality {
    abstract do(vector: Traction): Traction
}

/**
 * User defined inequality constraint in traction
 * @category Inequality
 */
export class UserTic extends Tic {
    constructor(private cb: InequalityCB) {super()}
    do(tract: Traction): Traction {
        return this.cb(tract)
    }
}

/**
 * @category Inequality
 */
export class Coulomb extends Tic {
    constructor(private friction: number, private cohesion: number, private lambda=0) {super()}
    do(tract: Traction): Traction {
        if (tract[1]>0) {
            return tract // opening mode
        }
        const tn         = tract[1]
        const shear      = Math.abs(tract[0])
        const extCoulomb = this.friction*tn*(1-this.lambda) + this.cohesion
        if (shear > extCoulomb) {
            const sc = 1.0 - extCoulomb/shear
            tract[0] = sc*tract[0]
        }
        tract[1] = 0
        return tract
    }
}

// -----------------------------------------------

/**
 * Base class for all inequality constraint in displacement
 * @category Inequality
 */
export abstract class Dic implements Inequality {
    do(enter: Displ): Displ { return [0,0] }
}

/**
 * User defined inequality constraint in displacement
 * @category Inequality
 */
export class UserDic extends Dic {
    constructor(private cb: InequalityCB) {super()}
    do(displ: Displ): Displ {
        return this.cb(displ)
    }
}

// -----------------------------------------------
