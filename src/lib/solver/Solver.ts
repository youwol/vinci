import { Model } from "../bem/Model"

/**
 * A user function which tells if we have to stop the solver when calling it.
 * Example:
 * ```ts
 * const solver  = new Seidel({model})
 * solver.stopCB = myGui.stopRequested
 * ```
 */
export type StopCallback      = () => boolean

/**
 * This function is invoked when necessary to provide extra information
 * when the solver is running
 */
export type MessageCallback   = (s: string) => any

/**
 * This function is called at each iteration, passing the current convergence
 * and iteration number
 */
export type IterationCallback = (convergence: number, iteration: number) => any

/**
 * Interface for a solver
 * @category Solvers
 */
export interface Solver {
    setup(model: Model): boolean
    run(): void
}
