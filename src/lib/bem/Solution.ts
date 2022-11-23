import { Model } from './Model'
import { Stress, Displ } from '../types'
import { Serie, createFrom } from '@youwol/dataframe'

/**
 * @category Core
 */
export class Solution {
    constructor(private model: Model) {
    }

    // Todo: (local = true, atSegment = true)
    /**
     * Get the computed and imposed displacement on faults
     * @note The return displacement is an array of [ux,uy, ux,uy, ...], each
     * entry being a fault
     */
    burgers() {
        const sol: Array<Array<number>> = []
        this.model.faults.forEach( fault => {
            const u = []
            fault.elements.forEach( e => u.push(e.burger[0], e.burger[1]) )
            sol.push(u)
        })
        
        return sol
    }

    /**
     * Get the displacement at pts location.
     * @note The return displacement is in the form [ux,uy, ux,uy, ...]
     */
    displ(pts: Serie): Serie {
        const isize = 2 //pts.itemSize
        if (isize < 2) {
            throw new Error('itemSize for points should be at least 2')
        }

        // const sol = Serie.create({
        //     array: createFrom({array: pts.array, count: pts.count, itemSize: 2}),
        //     itemSize: 2
        // })
        const sol = Serie.create({
            array: createFrom({array: pts.array, count: pts.count, itemSize: isize}),
            itemSize: isize,
            dimension: 2
        })

        let j = 0
        pts.forEach( (p, i) => {
            const u: Displ = [0,0]
            this.model.faults.forEach( fault => {
                fault.elements.forEach( e => {
                    const du = e.displ(p)
                    u[0] += du[0]
                    u[1] += du[1]
                })
            })
            sol.array[j++] = u[0]
            sol.array[j++] = u[1]
            // if (isize > 2) sol.array[j++] = 0
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

        const sol = Serie.create({
            array: createFrom({array: pts.array, count: pts.count, itemSize: 3}),
            itemSize: 3,
            dimension: 2
        })
        let j = 0
        pts.forEach( p => {
            const s: Stress = [0,0,0]
            this.model.faults.forEach( fault => {
                fault.elements.forEach( e => {
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
