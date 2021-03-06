import { Model } from "../bem/Model"

export type MessageCallback = (s: string) => any 
export type StopCallback = () => boolean 
export type IterationCallback = (convergence: number, iteration: number) => any

/**
 * @category Solvers
 */
export interface Solver {
    setup(model: Model): boolean
    run(): void
}
