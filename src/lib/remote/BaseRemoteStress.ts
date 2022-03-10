import { Point, Stress } from "../types"

/**
 * Base class for any remote stresses
 * @category Remote
 */
export interface BaseRemoteStress {
    at(p: Point): Stress
}
