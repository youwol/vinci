import { Model } from './Model'
import { Stress, Displ } from '../types'
import { Serie, createEmptySerie } from '@youwol/dataframe'

/**
 * @category Core
 */
export class Solution {
    constructor(private model: Model) {}

    // Todo: (local = true, atSegment = true)
    /**
     * Get the computed and imposed displacement on faults
     * @note The return displacement as a Serie of [ux,uy, ux,uy, ...], each
     * entry being a fault
     */
    burgers() {
        return this.model.faults.map((fault) => fault.burgersAsSerie)
    }

    /**
     * Get the displacement in 2D or in 3D (the third dimension being 0) at pts location
     * @note The return displacement is in the form [ux,uy, ux,uy, ...] or [ux,uy,uz, ux,uy,uz, ...]
     */
    displ(pts: Serie, in2D = true): Serie {
        const isize = in2D ? 2 : 3

        const sol = createEmptySerie({
            Type: Float32Array,
            count: pts.count,
            itemSize: isize,
            dimension: isize,
            shared: false,
        })

        let j = 0
        pts.forEach((p) => {
            const u: Displ = [0, 0]
            this.model.faults.forEach((fault) => {
                fault.elements.forEach((e) => {
                    const du = e.displ(p)
                    u[0] += du[0]
                    u[1] += du[1]
                })
            })
            sol.array[j++] = u[0]
            sol.array[j++] = u[1]
            if (isize > 2) {
                sol.array[j++] = 0
            }
        })

        return sol
    }

    /**
     * Get the stress at pts location.
     * @note The return stresses is in the form [Sxx,Syy,Sxy,  Sxx,Syy,Sxy, ...]
     */
    stress(pts: Serie): Serie {
        if (pts.itemSize < 2) {
            throw new Error('itemSize for points should be at least 2')
        }

        const sol = createEmptySerie({
            Type: Float32Array,
            count: pts.count,
            itemSize: 3,
            dimension: 2,
            shared: false,
        })

        let j = 0
        pts.forEach((p) => {
            const s: Stress = [0, 0, 0]
            this.model.faults.forEach((fault) => {
                fault.elements.forEach((e) => {
                    const ds = e.stress(p)
                    s[0] += ds[0]
                    s[1] += ds[1]
                    s[2] += ds[2]
                })
            })
            sol.array[j++] = s[0]
            sol.array[j++] = s[1]
            sol.array[j++] = s[2]
        })

        return sol
    }
}
