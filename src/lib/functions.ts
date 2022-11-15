import { Model } from "./bem/Model"
import { BaseRemoteStress } from "./remote"
import { add, dist2 } from "./math"
import { Fault } from "./bem/Fault"
import { Segment } from "./bem/Segment"
import { Stress, Normal, Traction, Point } from "./types"

/**
 * @category Remote
 */
 export function applyRemotes(model: Model) {
    
    // 1) reset bc values
    model.faults.forEach( (fault: Fault) => {
        fault.elements.forEach( (e: Segment) => {
            e.setBcValues([0,0])
        })
    })

    // 2) and set bc values by cumulating the remote effects
    model.remotes.forEach( (remote: BaseRemoteStress) => {
        model.faults.forEach( (fault: Fault) => {
            fault.elements.forEach( (e: Segment) => {
                const stress = remote.at(e.center)
                const t =  cauchy(stress, e.normal)
                e.addBcValues(t)
            })
        })
    })
}

/**
 * Helper function
 * @category Remote
 */
 export function cauchy(stress: Stress, n: Normal): Traction {
    // Remember: stress is organized as [xx, xy, yy]
    return [
        stress[0]*n[0] + stress[1]*n[1],
        stress[1]*n[0] + stress[2]*n[1]
    ]
}

/**
 * @category Utils
 */
 export function distToSegment2(p: Point, v: Point, w: Point) {
    const l2 = dist2(v, w)
    if (l2 == 0) {
        return dist2(p, v)
    }
    const dx = w[0] - v[0]
    const dy = w[1] - v[1]
    let t = ((p[0] - v[0])*dx + (p[1] - v[1])*dy)/l2
    t = Math.max(0, Math.min(1, t))
    return dist2(p, [v[0] + t*dx, v[1] + t*dy])
}

/**
 * @category Utils
 */
export function distToSegment(p: Point, v: Point, w: Point) {
    return Math.sqrt(distToSegment2(p, v, w))
}