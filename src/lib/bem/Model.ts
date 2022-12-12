import { Point } from '../types'
import { BBox } from '../utils/BBox'
import { Fault } from './Fault'
import { Material } from './Material'
import { BaseRemoteStress } from '../remote/BaseRemoteStress'

/**
 * @category Core
 */
export class Model {
    private faults_: Fault[] = []
    private remotes_: BaseRemoteStress[] = []
    private material_ = new Material(0.25, 1, 1)

    get faults(): Fault[] {
        return this.faults_
    }

    clear() {
        this.faults_ = []
        this.remotes_ = []
    }

    setMaterial(poisson: number, young: number, density: number) {
        this.material_.poisson = poisson
        this.material_.young = young
        this.material_.density = density

        this.faults_.forEach((fault) => {
            fault.material = this.material_
        })
    }

    get material() {
        return this.material_
    }

    get dof() {
        return this.faults_.reduce((cur, fault) => cur + fault.dof, 0)
    }

    addRemote(remote: BaseRemoteStress): void {
        this.remotes_.push(remote)
    }

    get remotes(): BaseRemoteStress[] {
        return this.remotes_
    }

    addFault(f: Fault) {
        this.faults_.push(f)
        f.material = this.material_
    }

    /**
     * Check if point p is too close to an element
     */
    tooClose(p: Point, delta = 1): boolean {
        for (let i = 0; i < this.faults_.length; ++i) {
            if (this.faults_[i].tooClose(p, delta)) {
                return true
            }
        }
        return false
    }

    /**
     * @return {center: Point, width: number, height: number}
     */
    get bounds(): BBox {
        const b = new BBox()
        this.faults_.forEach((fault) => {
            b.grow(fault.bounds)
        })
        return b
    }
}
