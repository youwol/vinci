import { Matrix, Vectord } from './types'
import { Point, Vector, Stress } from './types'

/**
 * @category Math
 */
export function dist(v: Point, w: Point) {
    return Math.sqrt(dist2(v,w))
}

/**
 * @category Math
 */
export function dist2(v: Point, w: Point) {
    return (v[0] - w[0])**2 + (v[1] - w[1])**2
}

/**
 * @category Math
 */
export function create(v1: Vector, v2: Vector): Vector {
    return [v2[0]-v1[0], v2[1]-v1[1]]
}

/**
 * @category Math
 */
export function norm(v: Vector): number {
    return Math.sqrt( v[0]**2 + v[1]**2 )
}
export function norm2(v: Vector): number {
    return v[0]**2 + v[1]**2
}

/**
 * @category Math
 */
export function normVec(v1: Vector, v2: Vector): number {
    return Math.sqrt( (v2[0]-v1[0])**2 + (v2[1]-v1[1])**2 )
}

/**
 * Copy values of v1 into v2
 * @category Math
 */
export function copy(v1: Vector, v2: Vector) {
    v2[0] = v1[0]
    v2[1] = v1[1]
}

/**
 * Copy values of v1 into v2
 * @category Math
 */
export function copyStress(v1: Stress, v2: Stress) {
    v2[0] = v1[0]
    v2[1] = v1[1]
    v2[2] = v1[2]
}

/**
 * Add 2 Vector and return a new one
 * @category Math
 */
export function add(v1: Vector, v2: Vector): Vector {
    return [v2[0]+v1[0], v2[1]+v1[1]]
}

/**
 * Add 2 Stress and return a new one
 * @category Math
 */
export function addStress(v1: Stress, v2: Stress): Stress {
    return [v2[0]+v1[0], v2[1]+v1[1], v2[2]+v1[2]]
}

/**
 * Perform `v2-v1` and return a new Vector
 * @category Math
 */
export function sub(v1: Vector, v2: Vector): Vector {
    return [v2[0]-v1[0], v2[1]-v1[1]]
}

/**
 * Scale a Vector and return a new one
 * @category Math
 */
export function scale(v: Vector, scale: number): Vector {
    return [v[0]*scale, v[1]*scale]
}

// -----------------------------------------------------------

export function allocMatrix(m: number, n: number) {
    const A = new Array(m).fill(undefined)
    for (let i=0; i<m; ++i) {
        A[i] = new Array(n).fill(0)
    }
    return A
}

// Performes: `result = Ab`
export function multVec(A: Matrix, b: Vectord, result: Vectord) {
    const aNumRows = A.length
    const aNumCols = A[0].length

    for (let r = 0; r < aNumRows; ++r) {
        result[r] = 0
        for (let c = 0; c < aNumCols; ++c) {
            result[r] += A[r][c] * b[c]
        }
    }
}

// Performes: `b = a + b`
export function addVec(a: Vectord, result: Vectord) {
    a.forEach( (v,i) => {
        result[i] += a[i]
    })
}

// Performs: `result = Bx + b`
export function multAdd(A: Matrix, x: Vectord, b: Vectord, result: Vectord) {
    multVec(A, x, result)
    // console.log(result)
    addVec(b, result)
    // console.log(result)
    // console.log('-----------')
}

/**
 * Usage
 * ```js
 * const lu = new Lu()
 * lu.beginConstruction(10); {
 *     lu.setValue(0,0, 0.457)
 *     lu.setValue(0,1, 1.233)
 *     ...
 * }; lu.endConstruction()
 * 
 * const s1 = lu.evaluate([1,2,3,8,5,3,7,6,0,1])
 * const s2 = lu.evaluate([7,3,2,4,3,2,9,5,0,8])
 * ```
 */
export class Lu {
    private isContructing = false
    private n_ = 0
    private EPS = 1.0e-12
    private indx: Vectord
    private a_: Matrix

    /**
     * Start the definition of a squared matrix `size*size`
     */
    beginConstruction(size: number) {
        if (this.isContructing) {
            throw new Error('Lu is already in construction mode')
        }

        this.isContructing = true
        this.n_ = size
        this.a_ = undefined
        this.a_ = new Array(size).fill(undefined)
        for (let i=0; i<size; ++i) {
            this.a_[i] = new Array(size).fill(0)
        }
    }

    /**
     * Set the value of the matrix entry (i,j), where `0<=i,j<size`
     * @param i Raw index between `0` and `size-1`
     * @param j Column index between `0` and `size-1`
     * @param value The value of the entry (i,j) in the matrix
     */
    setValue(i: number, j: number, value: number) {
        if (this.isContructing === false) {
            throw new Error('missing call to beginConstruction')
        }
        if (i >= this.n_) {
            throw new Error(`i (${i}) is out of range (${this.n_})`)
        }
        if (j >= this.n_) {
            throw new Error(`j (${i}) is out of range (${this.n_})`)
        }

        this.a_[i][j] = value
    }

    /**
     * Finish the construction of the matrix and perform the lu decomposition
     */
    endContruction() {
        if (this.isContructing === false) {
            throw new Error('missing call to beginConstruction')
        }

        this.isContructing = false
        this.decompose()
    }

    /**
     * Evaluate M.b and return the result as a new Vectord
     * @param b
     */
     evaluate(b: Vectord): Vectord {
        if (this.isContructing) {
            throw new Error('Lu is in construction mode, cannot evaluate.')
        }

        let ii=0,ip=0
        let sum=0

        const bb = [...b]

        for (let i=1; i<=this.n_; i++) {
            ip    = this.indx[i - 1]
            sum   = bb[ip - 1]
            bb[ip - 1] = bb[i - 1]
            if (ii) {
                for (let j=ii; j<=i-1; j++) {
                    sum -= this.a_[i - 1][j - 1] * bb[j - 1]
                }
            }
            else {
                if (sum) ii = i
            }
            bb[i - 1] = sum
        }

        for (let i=this.n_; i>=1; i--) {
            sum = bb[i - 1]
            for (let j=i+1; j<=this.n_; j++) {
                sum -= this.a_[i - 1][j - 1] * bb[j - 1]
            }
            bb[i - 1] = sum / this.a_[i - 1][i - 1]
        }

        return bb
    }

    /**
     * Force the garbage collection ?
     * Release the memory of the matrix and 
     */
    release() {
        if (this.isContructing) {
            throw new Error('Lu is in construction mode. Cannot release.')
        }

        this.n_   = 0
        this.a_   = undefined
        this.indx = undefined
        this.isContructing = false
    }

    /**
     * Decompose the matrix A
     */
    private decompose() {
        let imax = 0
        let big=0, dum=0, sum=0, temp=0
        const vv = new Array(this.n_).fill(0)
        this.indx = new Array(this.n_).fill(0)
        
        for (let i=1; i<=this.n_; i++) {
            big = 0
            for (let j=1; j<=this.n_; j++) {
                if ((temp=Math.abs(this.a_[i - 1][j - 1])) > big) big = temp
            }
            if (big == 0) throw new Error("Singular matrix in routine lu.decompose")
            vv[i - 1] = 1.0/big
        }
        for (let j=1; j<=this.n_; j++) {
            for (let i=1; i<j; i++) {
                sum = this.a_[i - 1][j - 1]
                for (let k=1; k<i; k++) {
                    sum -= this.a_[i - 1][k - 1] * this.a_[k - 1][j - 1]
                }
                this.a_[i - 1][j - 1] = sum
            }
            big = 0
            for (let i=j; i<=this.n_; i++) {
                sum = this.a_[i - 1][j - 1]
                for (let k=1; k<j; k++) {
                    sum -= this.a_[i - 1][k - 1] * this.a_[k - 1][j - 1]
                }
                this.a_[i - 1][j - 1] = sum
                if ( (dum=vv[i - 1]*Math.abs(sum)) >= big) {
                    big  = dum
                    imax = i
                }
            }
            if (j != imax) {
                for (let k=1; k<=this.n_; k++) {
                    dum = this.a_[imax - 1][k - 1]
                    this.a_[imax - 1][k - 1] = this.a_[j - 1][k - 1]
                    this.a_[j - 1][k - 1] = dum
                }
                vv[imax - 1] = vv[j - 1]
            }
            this.indx[j - 1] = imax
            if (this.a_[j - 1][j - 1] == 0.0) {
                this.a_[j - 1][j - 1] = this.EPS
            }
            if (j != this.n_) {
                dum = 1.0/(this.a_[j - 1][j - 1])
                for (let i=j+1; i<=this.n_; i++) {
                    this.a_[i - 1][j - 1] *= dum
                }
            }
        }
    }
}
