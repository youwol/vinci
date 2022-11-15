import { Solver, StopCallback, MessageCallback, IterationCallback } from "./Solver"
import { Model } from "../bem/Model"
import { applyRemotes } from "../functions"
import { System } from "./System"

/**
 * @example
 * ```js
 * const solver = new Seidel()
 * 
 * solver.messageCB  ( msg => console.log(msg) )
 * solver.warningCB  ( msg => console.log(msg) )
 * solver.errorCB    ( msg => console.log(msg) )
 * solver.iterationCB( (conv, iter) => console.log('iteration', iter, ':', conv) )
 * 
 * solver.setup(model)
 * solver.run()
 * ```
 * 
 * @category Solvers
 */
export class Seidel implements Solver {
    private model: Model = undefined
    private systems: System[] = []
    private tol_     = 1e-7
    private maxIter_ = 200
    private warCB = (msg: string) => {}
    private errCB = (msg: string) => {}
    private msgCB = (msg: string) => {}
    private stopCB: StopCallback = undefined
    private iterCB: IterationCallback = undefined
    private valid_ = false

    set messageCB  (m: MessageCallback)   {this.msgCB  = m}
    set warningCB  (m: MessageCallback)   {this.warCB  = m}
    set errorCB    (m: MessageCallback)   {this.errCB  = m}
    set iterationCB(m: IterationCallback) {this.iterCB = m}

    set tol    (t: number) {this.tol_     = t}
    set maxIter(t: number) {this.maxIter_ = t}

    constructor(
        {tol=1e-7, maxIter=200, model=undefined}:
        {tol?: number, model?: Model, maxIter?: number}={}
    ){
        this.tol_ = tol
        this.maxIter_ = maxIter
        if (model) {
            this.setup(model)
        }
    }

    setup(model: Model): boolean {
        this.model = model

        this.model.faults.forEach( fault => {
            fault.elements.forEach( e => {
                this.systems.push( new System([e], model, fault) )

                if (this.stopCB && this.stopCB()) {
                    this.warCB('solver initialization stopped by user')
                    this.valid_ = false
                    return false
                }
            })
        })

        // TODO: do we put that here or at the beginning of the run method?
        // applyRemotes(this.model)

        this.valid_ = true
        return true
    }

    run() {
        if (!this.valid_) {
            this.errCB('Cannot run the solver, initiallization was stopped by user')
            return
        }

        applyRemotes(this.model)

        this.msgCB('Solving the system...')

        let mag  = 1
        let iter = 0
        while (mag > this.tol_) {
            iter++
            mag = 0
            this.systems.forEach( sys => {
                mag += sys.solve()
            })

            if (iter>this.maxIter_) {
                if (this.warCB) this.warCB(`solver max iter reached (${this.maxIter_}). Exiting...`)
				break ;
            }

            if (iter%10 === 0 ) {
                if (this.stopCB && this.stopCB()) {
                    this.warCB('solver stopped by user. Exiting...')
                    break
                }
                this.msgCB(`iteration ${iter}, convergence ${mag}`)
            }

            if (this.iterCB) {
                this.iterCB(mag, iter)
            }
        }
        this.msgCB('Solver ended.')
    }
}
