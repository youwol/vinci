import { Stress } from '../types'
import { BaseRemoteStress } from './BaseRemoteStress'

/**
 * @category Remote
 */
export class RemoteStress implements BaseRemoteStress {
    constructor(private stress: Stress) {}
    at(): Stress {
        return [...this.stress] // copy
    }
}
