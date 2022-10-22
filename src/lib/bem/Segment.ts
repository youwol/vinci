import { Displ, Point, StressCoeff, DisplCoeff, Stress, Traction, Vector, TractionCoeff } from '../types'
import { Material } from '../bem/Material'
import { add, copy, normVec, scale } from '../math'
import { BBox } from '../utils/BBox'
import { distToSegment2 } from '../functions'

/**
 * Boundary condition type. `t` stands for traction and `b` for burger or displacement.
 * The first and second letters are for the shear and normal components, respectively.
 * @category Core
 */
export enum BC {
    Traction,
    Burger
}

/**
 * Define the axis of a segment (element making a fault)
 * @category Core
 */
export enum Axis {
    shear  = 0,
    normal = 1
}

/**
 * A segment (also known as element), composes a fault, i.e., a fault is made
 * of one or several segments. Each segment has a constant displacement
 * discontinuity vector (also known as Burger vector)
 * @category Core
 */
export class Segment {
    private c     : Point // center
    private sin = 0
    private cos = 0
    private l2  = 0
    private bcType_: [BC,BC] = [BC.Traction, BC.Traction]
    private u: Displ = [0, 0]
    private bcValue_: Traction = [0, 0]
    private mat: Material = undefined

    constructor(public begin: Point, public end: Point) {
        this.c   = scale(add(begin, end), 0.5)
        const l  = normVec(this.begin, this.end)
        this.sin = (this.end[1] - this.begin[1]) / l
        this.cos = (this.end[0] - this.begin[0]) / l
        this.l2  = l/2
    }

    get center(): Point {return this.c}
    get normal(): Point {return [-this.sin, this.cos]} // check

    get burger(): Displ {return this.u}
    set burger(u: Displ) {copy(u, this.u)}
    setBurger(i: number, value: number) {
        this.u[i] = value
    }

    bcType(i: number) {return this.bcType_[i]}
    setBcType(i: number, bc: BC) {this.bcType_[i] = bc}

    get bcValues() {return this.bcValue_}
    bcValue(i: number) {return this.bcValue_[i]}
    setBcValue(i: number, v: number) {this.bcValue_[i] = v}
    setBcValues(v: Vector) {this.bcValue_[0] = v[0]; this.bcValue_[1] = v[1]}
    addBcValues(v: Vector) {this.bcValue_[0] += v[0]; this.bcValue_[1] += v[1]}

    get dof() {
        return (this.bcType_[0]===BC.Traction?1:0) + (this.bcType_[1]===BC.Traction?1:0)
    }

    bounds(): BBox {
        return new BBox(this.begin, this.end)
    }

    /**
     * Check if point p is too close to this element
     */
    tooClose(p: Point, delta=1): boolean {
        if (distToSegment2(p, this.begin, this.end) < delta**2 * this.l2**2) return true
        // if (normVec(this.c, p) < this.l2) return true
        // if (normVec(this.begin, p) < this.l2) return true
        // if (normVec(this.end, p) < this.l2) return true
        return false
    }

    toLocal(p: Vector): Vector {
        return [
            (p[0] - this.c[0]) * this.cos + (p[1] - this.c[1]) * this.sin,
            -(p[0] - this.c[0]) * this.sin + (p[1] - this.c[1]) * this.cos
        ]
    }

    toGlobal(p: Vector): Vector {
        return [
            (p[0] - this.c[0]) * this.cos - (p[1] - this.c[1]) * this.sin,
            (p[0] - this.c[0]) * this.sin + (p[1] - this.c[1]) * this.cos
        ]
    }

    displNegPos(): {neg: Displ, pos: Displ} {
        const displ = this.displ(this.c)
        const usneg =  displ[0]*this.cos + displ[1]*this.sin // in global csys
        const unneg = -displ[0]*this.sin + displ[1]*this.cos
        const uspos = usneg - this.u[0]
        const unpos = unneg - this.u[1]
        return {
            neg: [usneg, unneg],
            pos: [uspos, unpos]
        }
    }

    // traction(): Traction {
    //     const s    = this.stress(this.c) // order is [xx, yy, xy]
    //     const cos  = this.cos
    //     const sin  = this.sin
    //     const cos2 = cos**2
    //     const sin2 = sin**2
    //     const sigs = (s[1] - s[0])*sin*cos + s[2]*(cos2 - sin2)
    //     const sign = s[0]*sin2 - 2*s[2]*sin*cos + s[1]*cos2
    //     return [sigs, sign]
    // }

    displ(p: Point): Displ {
        const displ = this.displCoeff(p)
        const bx  = this.u[0]
        const by  = this.u[1]
        const ux  = displ[0][0]*bx + displ[0][1]*by
        const uy  = displ[1][0]*bx + displ[1][1]*by
        return [ux, uy]
    }

    stress(p: Point): Stress {
        const stress = this.stressCoeff(p)
        const bx  = this.u[0]
        const by  = this.u[1]
        const sxx = stress[0][0]*bx + stress[0][1]*by
        const syy = stress[1][0]*bx + stress[1][1]*by
        const sxy = stress[2][0]*bx + stress[2][1]*by

        return [sxx, syy, sxy]
    }

    displAndStress(p: Point): {displ: Displ, stress: Stress} {
        const {displ, stress} = this.displAndStressCoeff(p)
        const bx  = this.u[0]
        const by  = this.u[1]
        const ux  = displ[0][0]*bx  + displ[0][1]*by
        const uy  = displ[1][0]*bx  + displ[1][1]*by
        const sxx = stress[0][0]*bx + stress[0][1]*by
        const syy = stress[1][0]*bx + stress[1][1]*by
        const sxy = stress[2][0]*bx + stress[2][1]*by

        return {
            displ : [ux, uy],
            stress: [sxx, syy, sxy]
        }
    }

    tractionCoeffs(p: Point): TractionCoeff {
        const {displ, stress} = this.displAndStressCoeff(p)
        const sin    = this.sin
        const cos    = this.cos
        const cos2   = cos**2
        const sin2   = sin**2
        const sincos = sin*cos

        const c = [[0,0], [0,0]] as TractionCoeff
        if (this.bcType_[0] == BC.Traction) {
            c[0][0] = (stress[1][0]-stress[0][0])*sincos + stress[2][0]*(cos2-sin2)
            c[0][1] = (stress[1][1]-stress[0][1])*sincos + stress[2][1]*(cos2-sin2)
        }
        else {
            c[0][0] = displ[0][0]*cos + displ[1][0]*sin
            c[0][1] = displ[0][1]*cos + displ[1][1]*sin
        }

        if (this.bcType_[1] == BC.Traction) {
            c[1][0] = stress[0][0]*sin2 - 2*stress[2][0]*sincos + stress[1][0]*cos2
            c[1][1] = stress[0][1]*sin2 - 2*stress[2][1]*sincos + stress[1][1]*cos2
        }
        else {
            c[1][0] = -displ[0][0]*sin + displ[1][0]*cos
            c[1][1] = -displ[0][1]*sin + displ[1][1]*cos
        }

        console.log(c)
        return c
    }

    displCoeff(p: Point): DisplCoeff {
        if (this.mat === undefined) throw new Error('material is not set')
        
        const con  = this.mat.con
        const pr1  = this.mat.pr1
        const pr2  = this.mat.pr2

        const x    = p[0]
        const y    = p[1]
        const cx   = this.c[0]
        const cy   = this.c[1]
        const cosb = this.cos
        const sinb = this.sin
        const a    = this.l2
        const xb   =  (x - cx)*cosb + (y - cy)*sinb
        const yb   = -(x - cx)*sinb + (y - cy)*cosb
        const r1s  = (xb - a)**2 + yb**2
        const r2s  = (xb + a)**2 + yb**2

        const fb2  = 0.5*con*(Math.log(r1s) - Math.log(r2s))
        let fb3 = 0
        const fb4  = con*(yb/r1s - yb/r2s)
        const fb5  = con*((xb - a)/r1s - (xb + a)/r2s)

        if (yb == 0) {
            if (Math.abs(xb) < a) {
                fb3 = con * Math.PI
            } else {
                fb3 = 0
            }
        }
        else {
            fb3 = -con * (Math.atan((xb + a) / yb) - Math.atan((xb - a) / yb))
        }

        const b1   = pr1*sinb*fb2
        const b2   = pr1*cosb*fb2
        const b3   = pr2*cosb*fb3
        const b4   = pr2*sinb*fb3
        const b5   = sinb*fb4 - cosb*fb5
        const b6   = cosb*fb4 + sinb*fb5
        const uxds = -b1 + b3 + yb*b5
        const uxdn = -b2 - b4 - yb*b6
        const uyds =  b2 + b4 - yb*b6
        const uydn = -b1 + b3 - yb*b5

        return [[uxds, uxdn], [uyds, uydn]]
    }

    /**
     * @return a matrix for which each line represents either Sxx, Syy or Sxy for the 2 coordinates (shear and normal)
     */
    stressCoeff(p: Point): StressCoeff {
        if (this.mat === undefined) throw new Error('material is not set')

        const con   = this.mat.con
        const cons  = this.mat.cons

        const x     = p[0]
        const y     = p[1]
        const cx    = this.c[0]
        const cy    = this.c[1]
        const cosb  = this.cos
        const sinb  = this.sin
        const a     = this.l2
        const cosb2 = cosb**2
        const sinb2 = sinb**2
        const cos2b = cosb2 - sinb2
        const sin2b = 2*sinb*cosb
        
        const xb    =  (x - cx)*cosb + (y - cy)*sinb
        const yb    = -(x - cx)*sinb + (y - cy)*cosb
        const r1s   =  (xb - a)**2 + yb*yb
        const r2s   =  (xb + a)**2 + yb*yb

        const fb4   = con*(yb/r1s - yb/r2s)
        const fb5   = con*((xb - a)/r1s - (xb + a)/r2s)
        const fb6   = con*(((xb - a)**2 - yb**2)/r1s**2 - ((xb + a)**2 - yb**2)/r2s**2)
        const fb7   = 2*con*yb*((xb - a)/r1s**2 - (xb + a)/r2s**2)

        const a1    = cos2b*fb6 - sin2b*fb7
        const a2    = sin2b*fb6 + cos2b*fb7
        const a3    = yb*a1
        const sxxds =  cons*(2*cosb2*fb4 + sin2b*fb5 + a3)
        const sxxdn =  cons*(-fb5 + yb*a2)
        const syyds =  cons*(2*sinb2*fb4 - sin2b*fb5 - a3)
        const syydn = -cons*(fb5 + yb*a2)
        const sxyds =  cons*(sin2b*fb4 - cos2b*fb5 + yb*a2)
        const sxydn = -cons*a3

        return [
            [sxxds, sxxdn],
            [syyds, syydn],
            [sxyds, sxydn]
        ]
    }

    displAndStressCoeff(p: Point): {displ: DisplCoeff, stress: StressCoeff} {
        if (this.mat === undefined) throw new Error('material is not set')

        const con   = this.mat.con
        const pr1   = this.mat.pr1
        const pr2   = this.mat.pr2
        const cons  = this.mat.cons
        const a     = this.l2

        const x     = p[0]
        const y     = p[1]
        const cx    = this.c[0]
        const cy    = this.c[1]
        const cosb  = this.cos
        const sinb  = this.sin

        const cosb2 = cosb**2
        const sinb2 = sinb**2
        const cos2b = cosb2 - sinb2
        const sin2b = 2*sinb*cosb

        const xb    =  (x - cx)*cosb + (y - cy)*sinb
        const yb    = -(x - cx)*sinb + (y - cy)*cosb

        const r1s   = (xb - a)**2 + yb**2
        const r2s   = (xb + a)**2 + yb**2

        const fb2   = 0.5*con*(Math.log(r1s) - Math.log(r2s))
        let   fb3: number ;
        const fb4   = con*(yb/r1s - yb/r2s)
        const fb5   = con*((xb - a)/r1s - (xb + a)/r2s)
        const fb6   = con*(((xb - a)**2 - yb**2)/r1s**2 - ((xb + a)**2 - yb**2)/r2s**2)
        const fb7   = 2*con*yb*((xb - a)/r1s**2 - (xb + a)/r2s**2)

        if (yb == 0) {
            if (Math.abs(xb) < a) {
                fb3 = con * Math.PI
            } else {
                fb3 = 0
            }
        }
        else {
            fb3 = -con*(Math.atan((xb + a)/yb) - Math.atan((xb - a)/yb))
        }

        const b1    = pr1*sinb*fb2
        const b2    = pr1*cosb*fb2
        const b3    = pr2*cosb*fb3
        const b4    = pr2*sinb*fb3
        const b5    = sinb*fb4 - cosb*fb5
        const b6    = cosb*fb4 + sinb*fb5
        const uxds  = -b1 + b3 + yb*b5
        const uxdn  = -b2 - b4 - yb*b6
        const uyds  =  b2 + b4 - yb*b6
        const uydn  = -b1 + b3 - yb*b5

        const a1    = cos2b*fb6 - sin2b*fb7
        const a2    = sin2b*fb6 + cos2b*fb7
        const a3    = yb*a1
        const sxxds =  cons*(2*cosb2*fb4 + sin2b*fb5 + a3)
        const sxxdn =  cons*(-fb5 + yb*a2)
        const syyds =  cons*(2*sinb2*fb4 - sin2b*fb5 - a3)
        const syydn = -cons*(fb5 + yb*a2)
        const sxyds =  cons*(sin2b*fb4 - cos2b*fb5 + yb*a2)
        const sxydn = -cons*a3

        return {
            displ : [
                [uxds, uxdn],
                [uyds, uydn]
            ],
            stress: [
                [sxxds, sxxdn],
                [syyds, syydn],
                [sxyds, sxydn]
            ]
        }
    }

    /**
     * @hidden
     */
    setMaterial(mat: Material) {
        this.mat = mat
    }
}
