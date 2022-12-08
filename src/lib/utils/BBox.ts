import { Point, Vector } from '../types'
import { add, norm, scale, create } from '../math'

const BBOX_FLATNESS_THRESHOLD = 1e-12

/**
 * @category Utils
 */
export class BBox {
    private min_: Vector = [0, 0]
    private max_: Vector = [0, 0]
    private empty_ = false

    constructor(p1?: Point, p2?: Point) {
        this.reset()
        if (p1 && p2) {
            for (let i = 0; i < 2; ++i) {
                const min = Math.min(p1[i], p2[i])
                const Max = Math.max(p1[i], p2[i])
                if (Math.abs(Max - min) >= BBOX_FLATNESS_THRESHOLD) {
                    this.min_[i] = min
                    this.max_[i] = Max
                } else {
                    this.min_[i] = Max
                    this.max_[i] = Max
                }
                if (Max < min) this.empty_ = true
            }
        }
    }
    reset() {
        this.empty_ = true
        this.min_ = [1e32, 1e32]
        this.max_ = [-1e32, -1e32]
    }

    get empty() {
        return this.empty_
    }
    get min(): Vector {
        return [...this.min_] as Vector
    }
    get max(): Vector {
        return [...this.max_] as Vector
    }
    get xLength() {
        return this.max_[0] - this.min_[0]
    }
    get yLength() {
        return this.max_[1] - this.min_[1]
    }
    get sizes() {
        return [this.xLength, this.yLength]
    }
    get center(): Vector {
        let c = [...this.min_] as Vector
        c = scale(add(c, this.max_), 0.5)
        return c
    }
    get radius(): number {
        return norm(create(this.min_, this.max_)) / 2
    }

    scale(s: number) {
        let r1 = add(scale(create(this.center, this.min), s), this.center)
        let r2 = add(scale(create(this.center, this.max), s), this.center)
        this.min_ = r1
        this.max_ = r2
    }

    grow(p: Vector | BBox) {
        this.empty_ = false
        if (p instanceof BBox) {
            this.grow(p.min)
            this.grow(p.max)
        } else {
            for (let i = 0; i < 2; ++i) {
                if (p[i] < this.min_[i]) this.min_[i] = p[i]
                if (p[i] > this.max_[i]) this.max_[i] = p[i]
            }
        }
    }

    /**
     * Check if a bbox or a Point (Vector) is inside this (not strict)
     * @param param Either a BBox or a Vector
     * @param tol The tolerence for the test
     */
    contains(param: any, tol = 0): boolean {
        if (param instanceof BBox) {
            return (
                this.contains(param.min, tol) === true &&
                this.contains(param.max, tol) === true
            )
        }

        const p = param.data // a Vector
        for (let i = 0; i < 2; ++i) {
            if (p[i] < this.min_[i] - tol || p[i] > this.max_[i] + tol) {
                return false
            }
        }
        return true
    }

    /**
     * For compatibility
     * @deprecated
     * @see contains
     */
    inside(p: any, tol = 0): boolean {
        return this.contains(p, tol)
    }

    getIntersection(b: BBox): BBox {
        if (this.intersect(b) === false) {
            return new BBox()
        }

        const new_min = [0, 0] as Vector
        const new_max = [0, 0] as Vector

        for (let i = 0; i < 2; ++i) {
            if (this.min_[i] >= b.min_[i]) {
                new_min[i] = this.min_[i]
            } else {
                new_min[i] = b.min_[i]
            }

            if (this.max_[i] <= b.max_[i]) {
                new_max[i] = this.max_[i]
            } else {
                new_max[i] = b.max_[i]
            }
        }
        return new BBox(new_min, new_max)
    }

    intersect(b: BBox): boolean {
        let ok = true
        for (let i = 0; i < 2; ++i) {
            ok = ok && this.min_[i] <= b.max_[i] && b.min_[i] <= this.max_[i]
        }
        return ok
    }
}
