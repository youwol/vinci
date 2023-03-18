const SvgParser = require('svg-parser')
const fs = require('fs')

const txt = fs.readFileSync(
    '/Users/fmaerten/data/vinci/svg/HAPPY_NEW_YEAR_2023.svg',
    'utf8',
)

const header = 'GOCAD PLine 1.0\nHEADER {\nname=dxf\n}\n'
const footer = 'END\n'
let buffer = ''

SvgParser.parse(txt).children[0].children.forEach((tag) => {
    if (tag.tagName === 'g') {
        tag.children.forEach((a) => {
            if (a.tagName === 'line') {
                buffer += header
                buffer += `VRTX 0 ${a.properties.x1} ${a.properties.y1} 0\n`
                buffer += `VRTX 1 ${a.properties.x2} ${a.properties.y2} 0\n`
                buffer += `SEG 0 1\n`
                buffer += footer
            } else if (a.tagName === 'polyline' || a.tagName === 'polygon') {
                const pts = a.properties.points
                    .replaceAll(',', ' ')
                    .replaceAll('\t', '')
                    .trim()
                    .split(' ')

                buffer += header
                let id = 0
                for (let i = 0; i < pts.length; i += 2) {
                    buffer += `VRTX ${id++} ${pts[i]} ${pts[i + 1]} 0\n`
                }
                for (let i = 0; i < pts.length / 2 - 1; ++i) {
                    buffer += `SEG ${i} ${i + 1}\n`
                }
                buffer += footer
            }
        })
    }
})

fs.writeFileSync(
    '/Users/fmaerten/data/vinci/pl/HAPPY_NEW_YEAR_2023.pl',
    buffer,
    'utf8',
    (_err) => {},
)
