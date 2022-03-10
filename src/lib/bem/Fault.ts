import { Point, Vectord } from "../types"
import { Material } from "./Material"
import { BC, Segment } from "./Segment"
import { BBox } from "../utils/BBox"
import { Tic, Dic } from "./inequalities"
import { Serie } from "@youwol/dataframe"
import { FaultBuilder } from "../utils/FaultBuilder"

/**
 * @category Core
 */
export class Fault {
    private segs_: Segment[] = []
    private bc: [BC, BC] = [BC.Traction, BC.Burger]
    private material_: Material = undefined
    private tics_: Tic[]
    private dics_: Dic[]

    constructor(points: Vectord | Serie = undefined) {
        if (points) {
            const b = new FaultBuilder()
            b.setPoints(points)
            b.fault.elements.forEach( seg => this.addElement(seg))
        }
    }

    get elements() {return this.segs_}
    get dof() {
        return this.segs_.reduce( (cur,seg) => cur+seg.dof, 0)
    }

    addElement(s: Segment) {
        this.segs_.push(s)
        if (this.material_) {
            s.setMaterial(this.material_)
        }
    }

    /**
     * Add a traction inequality constraint.
     * 
     * Example
     * ```js
     * const f = new Fault()
     * ...
     * f.addTic( new UserTic( t => {
     *      if (t[0]<0) return [0, t[1], t[2]]
     *      else return t
     * }))
     * ```
     */
    addTic(tic: Tic) { this.tics_.push(tic) }
    get tics() { return this.tics_ }

    /**
     * Add a displacement inequality constraint
     * 
     * Example
     * ```js
     * const f = new Fault()
     * ...
     * f.addDic( new UserDic( u => {
     *      const slip = Math.sqrt(u[1]**2 + u[2]**2)
     *      if (slip > Math.abs(u[0])) return [u[0], 0, 0]
     *      else return u
     * }))
     * ```
     */
    addDic(dic: Dic) { this.dics_.push(dic) }
    get dics() { return this.dics_ }

    /**
     * Check if point p is too close to an element
     */
    tooClose(p: Point, delta=1): boolean {
        for (let i=0; i<this.segs_.length; ++i) {
            if (this.segs_[i].tooClose(p, delta)) return true
        }
        return false
    }

    /**
     * @return {center: Point, width: number, height: number}
     */
    get bounds(): BBox {
        const b = new BBox()
        this.segs_.forEach( seg => {
            b.grow(seg.begin)
            b.grow(seg.end)
        })
        return b
    }

    get bcType() {return this.bc}

    /**
     * Set the type of boundary conditions. Possible string values are `tt`, `bb`, `tb` or `bt` 
     */
    set bcType(bc: [BC | string, BC | string]) {
        for (let i=0; i<2; ++i) {
            if (typeof bc[i] === 'string') {
                switch(bc[i]) {
                    case 't': this.setBcType_(i, BC.Traction); break
                    case 'b': this.setBcType_(i, BC.Burger); break
                    default: throw new Error(`Unknown bc type ${bc}. Should be "t" or "b"`)
                }
            }
            else {
                this.setBcType_(i, bc[i] as BC)
            }
        }
    }

    /**
     * Set the burger's vectors for all segments. Possible arguments are a [[Serie]] of
     * size the number of segments times 2, an array of size the number of segments times 2, or
     * an array of size 2:
     * ```js
     * // We consider a fault made of 3 segments
     * f.burgers = dataframe.series.U // one for each segement
     * f.burgers = [0,1, 0,1, 0,1] // one for each segement
     * f.burgers = [0,1] // set for all segments
     * ```
     */
    set burgers(burgers: Serie | Vectord) {
        if (burgers instanceof Serie) {
            if (burgers.itemSize < 2) {
                throw new Error(`burgers itemSize (${burgers.itemSize}) should be >= 2`)
            }
            if (burgers.count !== this.elements.length) {
                throw new Error(`burgers count (${burgers.count}) should be equals to the number of segments (${this.elements.length})`)
            }
            this.elements.forEach( (e, i) => {
                const b = burgers.itemAt(i)
                e.burger = [b[0], b[1]]
            })
        }
        else if (Array.isArray(burgers) && burgers.length === this.elements.length*2) {
            this.elements.forEach( (e, i) => {
                //const b = burgers.itemAt(i)
                e.burger = [burgers[2*i], burgers[2*i+1]]
            })
        }
        else if (Array.isArray(burgers) && burgers.length===2) {
            this.elements.forEach( (e, i) => {
                //const b = burgers.itemAt(i)
                e.burger = [burgers[0], burgers[1]]
            })
        }
        else {
            throw new Error("don't know how to set the burgers (bad argument)")
        }
    }

    get burgers() {
        const r: Vectord = []
        this.elements.forEach( e => {
            r.push(...e.burger)
        })
        return r
    }

    /**
     * @hidden
     */
    private setBcType_(i: number, bc: BC) {
        this.bc[i] = bc
        this.segs_.forEach( seg => {
            seg.setBcType(i, bc)
        })
    }

    /**
     * @hidden
     */
    set material(mat: Material) {
        this.material_ = mat
        this.segs_.forEach( seg => {
            seg.setMaterial(mat)
        })
    }
}
