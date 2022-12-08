import { Vectord, Matrix, Traction, Displ } from '../types'
import { Model } from '../bem/Model'
import { Segment, BC } from '../bem/Segment'
import { allocMatrix, Lu, multAdd, norm2 } from '../math'
import { Fault } from '../bem'
// import { Displ, Traction } from ".."

/**
 * @hidden
 * @category Solvers
 */
export class System {
    lu: Lu = new Lu() // Inverted self influence matrix Aii as LU
    B_: Matrix // Influence matrix for rhs Bij
    cstRhs_: Vectord // Constant rhs vector
    b_: Vectord // Constant rhs vector
    x_: Vectord // Varying rhs vector
    ts_: Segment[] = undefined // Influenced segments
    rts_: Segment[] = undefined // All model segments except those in ts_
    dof_ = 0
    dof2_ = 0

    constructor(es: Segment[], model: Model, private fault: Fault) {
        this.ts_ = [...es]
        this.dof_ = es.reduce((cur, ee) => cur + ee.dof, 0)
        this.initialize(model)

        // Have to check that es are really part of fault!!!
    }

    solve(): number {
        if (this.dof_ === 0) return

        // Compute B_
        this.getTotalTraction(this.x_)
        this.applyTics(this.x_ as Traction)

        // solve
        this.lu.evaluate(this.x_)
        this.applyDics(this.x_ as Displ)

        return this.setSolution()
    }

    private initialize(model: Model) {
        this.dof2_ = 0
        this.rts_ = []

        model.faults.forEach((fault) => {
            fault.elements.forEach((e) => {
                if (!this.ts_.includes(e)) {
                    this.rts_.push(e)
                    this.dof2_ += e.dof
                }
            })
        })

        this.b_ = new Array(this.dof_).fill(0)
        this.cstRhs_ = new Array(this.dof_).fill(0)
        // this.x_      = new Array(this.dof2_).fill(0)
        this.x_ = new Array(this.dof_).fill(0)
        this.B_ = allocMatrix(this.dof_, this.dof2_)

        // -------------------------
        // Right hand side of Ax = b
        // -------------------------
        let eqnNum = 0
        this.ts_.forEach((e) => {
            for (let i = 0; i < 2; ++i) {
                if (e.bcType(i) === BC.Traction) {
                    this.b_[eqnNum++] = -e.bcValue(i) // initial value of b (constant terms = initial tractions = Neumann)
                } else {
                    e.setBurger(i, e.bcValue(i)) // set bc values as Burgers if necessary (Dirichlet)
                }
            }
        })

        // -----------------------------------------------------------------
        // Building of the self influence matrix Aii that has to be inverted
        // -----------------------------------------------------------------
        this.lu.beginConstruction(this.dof_) // alloc
        let rplus, cplus
        let row = 0
        this.ts_.forEach((e1) => {
            // <------------- loop e1, the main element
            if (e1.dof > 0) {
                let col = 0
                this.ts_.forEach((e2) => {
                    // <------------- loop e2
                    const Tij = e2.tractionIcAt(e1.center) // e2 influence e1
                    rplus = 0
                    for (let i = 0; i < 2; ++i) {
                        if (e1.bcType(i) === BC.Traction) {
                            cplus = 0
                            for (let j = 0; j < 2; ++j) {
                                if (e2.bcType(j) === BC.Traction) {
                                    // e2 is an unknown => part of A for e1
                                    this.lu.setValue(
                                        row + rplus,
                                        col + cplus,
                                        Tij[i][j],
                                    )
                                    ++cplus
                                } else {
                                    const v = Tij[i][j] * e2.burger[j]
                                    this.cstRhs_[row + rplus] -= v
                                }
                            }
                            ++rplus
                        }
                    }
                    col += cplus
                }) // e2
                row += rplus
            }
        }) // e1

        this.lu.endContruction()

        // -----------------------------------------------------------------
        // Building of the other matrix Bij that must NOT be inverted
        // NOTE: rows are "self" and columns are "model-self"
        // -----------------------------------------------------------------
        row = 0
        this.ts_.forEach((e1) => {
            // Main element from this system
            if (e1.dof > 0) {
                let col = 0
                this.rts_.forEach((e2) => {
                    // All the other elements **in the model**
                    const Tij = e2.tractionIcAt(e1.center) // e2 influence e1
                    rplus = 0
                    for (let i = 0; i < 2; ++i) {
                        if (e1.bcType(i) === BC.Traction) {
                            cplus = 0
                            for (let j = 0; j < 2; ++j) {
                                if (e2.bcType(j) === BC.Traction) {
                                    this.B_[row + rplus][col + cplus] =
                                        -Tij[i][j] // Neumann for e2 goes to B_
                                    ++cplus
                                } else {
                                    let v = Tij[i][j] * e2.burger[j] // Dirichlet for e2 in cst rhs
                                    this.cstRhs_[row + rplus] -= v
                                }
                            }
                            ++rplus
                        }
                    }
                    col += cplus
                })
                row += rplus
            }
        })
    }

    private setSolution(): number {
        let id = 0
        let mag = 0
        this.ts_.forEach((t) => {
            const prevMag = norm2(t.burger)
            for (let i = 0; i < 2; ++i) {
                if (t.bcType(i) == BC.Traction) {
                    t.setBurger(i, this.x_[id])
                    id++
                }
            }
            const curMag = norm2(t.burger)
            mag += Math.abs(curMag - prevMag)
        })

        return mag
    }

    // Get the total traction before multiplying by A-1
    // (the self influence matrix)
    private getTotalTraction(sol: Vectord) {
        /// update b
        let eqnNum = 0
        this.ts_.forEach((e1) => {
            for (let i = 0; i < 2; ++i) {
                if (e1.bcType(i) === BC.Traction) {
                    this.b_[eqnNum] = -(e1.bcValue(i) + this.cstRhs_[eqnNum])
                    eqnNum++
                }
            }
        })

        // Update the RHS as Burgers since rts_ is varying...
        const z = new Array(this.dof2_).fill(0)
        let index = 0
        this.rts_.forEach((e2) => {
            for (let i = 0; i < 2; ++i) {
                if (e2.bcType(i) == BC.Traction) {
                    z[index++] = e2.burger[i] // computed from previous iteration
                }
            }
        })

        multAdd(this.B_, z, this.b_, sol)
    }

    private applyDics(u: Displ): Displ {
        return this.fault.dics.reduce((cur, dic) => dic.do(cur), u)
    }

    private applyTics(t: Traction): Traction {
        return this.fault.tics.reduce((cur, tic) => tic.do(cur), t)
    }
}
