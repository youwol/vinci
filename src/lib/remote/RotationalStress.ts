import { Point, Stress } from '../types'
import { BaseRemoteStress } from './BaseRemoteStress'

/**
 * @category Remote
 */
export class RotationalStress implements BaseRemoteStress {
    private theta_: number = 0
    private S1_: number = 0
    private S2_: number = 0
    private s: number = 0
    private c: number = 0

    constructor(S1: number, S2: number, theta: number) {
        this.theta_ = theta
        this.S1_ = S1
        this.S2_ = S2
        const a = (this.theta_ * Math.PI) / 180
        this.c = Math.cos(a)
        this.s = Math.sin(a)
    }

    set theta(t: number) {
        this.theta_ = t

        const a = (this.theta_ * Math.PI) / 180
        this.c = Math.cos(a)
        this.s = Math.sin(a)
    }
    get theta() {
        return this.theta_
    }

    set S1(t: number) {
        this.S1_ = t
    }
    get S1() {
        return this.S1_
    }

    set S2(t: number) {
        this.S2_ = t
    }
    get S2() {
        return this.S2_
    }

    at(p: Point): Stress {
        return [
            this.S1_ * this.c ** 2 + this.S2_ * this.s ** 2,
            (this.S2_ - this.S1_) * this.c * this.s,
            this.S1_ * this.s ** 2 + this.S2_ * this.c ** 2,
        ]
    }
}
