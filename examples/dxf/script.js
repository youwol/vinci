const vinci = require('../../dist/@youwol/vinci')
const io = require('@youwol/io')
const df = require('@youwol/dataframe')
const fs = require('fs')

const name = 'horizontal'

const buffer = fs.readFileSync(
    '/Users/fmaerten/data/vinci/dxf/' + name + '.dxf',
    'utf8',
)
const r = vinci.dxfDecoder(buffer)

console.log(r)

const pos = []
const ind = []
let i = 0
r.forEach((rr) => {
    pos.push(rr[0], rr[1], 0, rr[2], rr[3], 0)
    ind.push(i, i + 1)
    i += 2
})
const position = df.Serie.create({ array: pos, itemSize: 3 })
const indices = df.Serie.create({ array: ind, itemSize: 2 })

let out = 'GOCAD Polyline 1.0\nHEADER{\nname: lines\n}\n'
for (let i = 0; i < position.count; i += 2) {
    const v1 = position.itemAt(i)
    const v2 = position.itemAt(i + 1)
    out += `VRTX ${i} ${v1[0]} ${v1[1]} 0\n`
    out += `VRTX ${i + 1} ${v2[0]} ${v2[1]} 0\n`
    out += `SEG ${i} ${i + 1}\n`
    out += `ILINE\n`
}
out += 'END'

fs.writeFileSync(
    '/Users/fmaerten/data/vinci/pl/' + name + '.pl',
    out,
    'utf8',
    (err) => {},
)
