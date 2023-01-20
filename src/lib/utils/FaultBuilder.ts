import { Serie } from '@youwol/dataframe'
import { Model } from '../bem/Model'
import { Fault } from '../bem/Fault'
import { add, create, scale } from '../math'
import { Axis, Segment, BC } from '../bem/Segment'
import { Vector, Vectord } from '../types'
import { Dic, Tic } from '../bem'

/**
 * This class allows to build incrementally a fault composed of segments,
 * or to set the contiguous segments using a Serie (position of points)
 * @example
 * ```js
 * import { Model, FaultBuilder } from '@youwol/vinci'
 *
 * const model   = new Model()
 *
 * const builder = FaultBuilder.create(model)
 *    .addPoint([0,0])
 *    .addPoint([1,1])
 *    .subdivide(10)
 *    .setBcType('tt')
 *    .addToModel() // put first fault into the model
 *    .addPoint([2,0])
 *    .addPoint([3,1])
 *    .subdivide(20)
 *    .setBcType('tb')
 *    .addToModel() // put second fault into the model (do not forget this call at the end)
 * ```
 * @example
 * ```js
 * import { Model, FaultBuilder } from '@youwol/vinci'
 *
 * const builder = FaultBuilder.create()
 *    .addPoint([0,0])
 *    .addPoint([1,1])
 *    .subdivide(10)
 *    .setBcType('tt')
 *    // Here, do not call addToModel() as the model is undefined!
 *
 * // Instead, construct a fault using the builder
 * const fault = new Fault(builder)
 * ```
 * @category Utils
 */
export class FaultBuilder {
    private prev: Vector = undefined
    private fault_: Fault = new Fault()

    constructor(private model: Model = undefined) {}

    get fault() {
        return this.fault_
    }

    /**
     * Start a new fault construction
     */
    reset() {
        this.fault_ = new Fault()
        this.prev = undefined
        return this
    }

    /**
     * Add the current built fault into the provided model if any
     */
    addToModel() {
        if (this.model === undefined) {
            console.warn('Model is not set while calling done()')
        } else {
            this.model.addFault(this.fault_)
        }
        return this
    }

    /**
     * @example
     * ```js
     * const builder = new FaultBuilder()
     * // create 2 segments
     * builder
     *      .addPoint([0,0])
     *      .addPoint([1,0])
     *      .addPoint([2,1])
     *      .setBcType('bb')
     *      .setBurger([1,0])
     *      .addTo(model)
     * // or model.addFault(builder.fault)
     * ```
     */
    addPoint(p: Vector) {
        if (this.prev !== undefined) {
            this.fault_.addElement(new Segment(this.prev, p))
            this.prev = [...p]
        }
        this.prev = [...p]
        return this
    }

    setPoints(p: Vectord | Serie) {
        if (Array.isArray(p)) {
            Serie.create({ array: p, itemSize: 2 }).forEach((P) =>
                this.addPoint(P),
            )
        } else {
            p.forEach((P) => this.addPoint(P))
        }
        return this
    }

    /**
     * Subdivide each segment in n sub-segments
     */
    subdivide(n = 2) {
        if (n < 2) {
            return this
        }

        const fault = new Fault()
        const segments = this.fault_.elements
        segments.forEach((seg) => {
            let start = seg.begin
            let end = start
            const step = scale(create(start, seg.end), 1 / n)
            for (let i = 0; i < n; ++i) {
                end = add(end, step)
                fault.addElement(new Segment(start, end))
                start = end
            }
        })
        this.fault_ = fault
        return this
    }

    setBcType(bc: [BC | string, BC | string]) {
        this.fault_.bcType = bc
        return this
    }

    setBurger(burgers: Serie | Vectord) {
        this.fault_.burgers = burgers
        return this
    }

    addTic(tic: Tic) {
        this.fault_.addTic(tic)
        return this
    }

    addDic(dic: Dic) {
        this.fault_.addDic(dic)
        return this
    }

    setBurgersForAxis(axis: Axis, burgers: number | Serie | Vectord) {
        if (burgers instanceof Serie) {
            if (burgers.itemSize !== 1) {
                throw new Error(
                    `burgers itemSize (${burgers.itemSize}) should be 1`,
                )
            }
            if (burgers.count !== this.fault_.elements.length) {
                throw new Error(
                    `burgers count (${burgers.count}) should be equals to the number of segments (${this.fault_.elements.length})`,
                )
            }
            this.fault_.elements.forEach((e, i) => {
                const b = burgers.array[i]
                e.burger[axis] = b
            })
        } else if (
            Array.isArray(burgers) &&
            burgers.length === this.fault_.elements.length
        ) {
            this.fault_.elements.forEach((e, i) => {
                e.burger[axis] = burgers[i]
            })
        } else if (typeof burgers === 'number') {
            this.fault_.elements.forEach((e) => {
                e.burger[axis] = burgers
            })
        } else {
            throw new Error("don't know how to set the burgers (bad argument)")
        }
        return this
    }
}
