import { Point, Stress } from '../types'
import { BaseRemoteStress } from './BaseRemoteStress'

/**
 *
 * @category Remote
 */
export class LithostaticStress implements BaseRemoteStress {
    /**
     * @param density The density of the rock
     * @param ratio SigmaH / SigmaV
     */
    constructor(private density: number, private ratio: number) {}

    at(p: Point): Stress {
        const z = this.density * 9.81 * p[1]
        return [z * this.ratio, 0, z]
    }
}
