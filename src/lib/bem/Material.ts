/**
 * @category Core
 */
export class Material {
    private rho = 1
    private pr = 0.25
    private e = 1

    private con_ = 1 / (4 * Math.PI * (1 - this.pr))
    private cons_ = this.e / (1 + this.pr)
    private pr1_ = 1 - 2 * this.pr
    private pr2_ = 2 * (1 - this.pr)

    constructor(poisson: number, young: number, density: number = 1) {
        this.pr = poisson
        this.e = young
        this.rho = density
    }

    get poisson() {
        return this.pr
    }
    set poisson(v: number) {
        this.pr = v
        this.update()
    }

    get young() {
        return this.e
    }
    set young(v: number) {
        this.e = v
        this.update()
    }

    get density() {
        return this.rho
    }
    set density(v: number) {
        this.rho = v
    }

    // For conveniance...
    /**
     * @hidden
     */
    get con() {
        return this.con_
    }
    /**
     * @hidden
     */
    get cons() {
        return this.cons_
    }
    /**
     * @hidden
     */
    get pr1() {
        return this.pr1_
    }
    /**
     * @hidden
     */
    get pr2() {
        return this.pr2_
    }

    // ---------------------------------------------------------

    private update() {
        this.con_ = 1 / (4 * Math.PI * (1 - this.pr))
        this.cons_ = this.e / (1 + this.pr)
        this.pr1_ = 1 - 2 * this.pr
        this.pr2_ = 2 * (1 - this.pr)
    }
}
