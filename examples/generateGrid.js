const geom = require('@youwol/geometry')
const df = require('@youwol/dataframe')

function generateRectangle({ a, b, na, nb, center = [0, 0, 0], badFct }) {
    // const add = (x, y) =>
    //     nodes.push(x + center[0] - a / 2, y + center[1] - b / 2, center[2])
    const nodes = []
    const aa = 1 / (na - 1)
    const bb = 1 / (nb - 1)
    for (let i = 0; i < na; ++i) {
        for (let j = 0; j < nb; ++j) {
            const x = a * i * aa + center[0] - a / 2
            const y = b * j * bb + center[1] - b / 2
            if (badFct && badFct(x, y) === false) {
                nodes.push(x, y, center[2])
            } else {
                //console.log('skipping one point')
            }
        }
    }

    return geom.triangulate(df.Serie.create({ array: nodes, itemSize: 3 }))
}

module.exports = generateRectangle
