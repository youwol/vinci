import { Point, Stress } from "../types"

export type FunctionalRemote = (p: Point) => Stress

/**
 * Base class for any remote stresses
 * @category Remote
 */
export interface BaseRemoteStress {
    at(p: Point): Stress
}
