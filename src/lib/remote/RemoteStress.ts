import { Point, Stress } from '../types'
import { BaseRemoteStress } from './BaseRemoteStress'

/**
 * @category Remote
 */
export class RemoteStress implements BaseRemoteStress {
    constructor(private stress: Stress) {}
    at(_p: Point): Stress {
        return [...this.stress] // copy
    }
}
