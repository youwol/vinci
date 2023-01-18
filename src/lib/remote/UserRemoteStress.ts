import { Point, Stress } from '../types'
import { BaseRemoteStress, FunctionalRemote } from './BaseRemoteStress'

const DefaultFct = (/*p: Point*/): Stress => [0, 0, 0]

/**
 * Define a user remote
 * @example
 * ```js
 * const rho = 1000
 * const g   = 9.81
 * const Rh  = 0.2
 *
 * const remote = new vinci.UserRemoteStress( p => {
 *      const Sv = rho * g * p[1]
 *      const Sh = Sv * Rh
 *      return [Sh, 0, Sv]
 * })
 *
 * model.addRemote( remote )
 * ```
 * @category Remote
 */
export class UserRemoteStress implements BaseRemoteStress {
    private cb_: FunctionalRemote = DefaultFct

    constructor(cb: FunctionalRemote) {
        this.cb_ = cb
    }

    setFunction(cb: FunctionalRemote) {
        this.cb_ = cb
    }

    at(p: Point): Stress {
        return this.cb_(p)
    }
}
