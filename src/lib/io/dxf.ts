/* Assuming a list of:
LINE
8
Calque 1
10
6.425910
20
66.390800
11
7.497000
21
67.080556
0
*/

//import { Serie } from "@youwol/dataframe"s

export type DxfReturnType = [number, number, number, number][]

export function dxfDecoder(buffer: string): DxfReturnType {
    const lines = buffer.split('\n')

    const segments: DxfReturnType = []

    let i = 0
    const condition = true
    const nextLine = () => {
        while (condition) {
            if (i >= lines.length) {
                return undefined
            }
            const line = lines[i++]
            if (line.length !== 0) {
                const r = line.split(' ')
                if (r.length !== 0) {
                    return r
                }
            }
        }
    }

    while (condition) {
        const r = nextLine()
        if (r === undefined) {
            break
        }
        if (r[0] === 'LINE') {
            nextLine()
            nextLine()
            nextLine()
            const x1 = parseFloat(nextLine()[0])
            nextLine()
            const y1 = parseFloat(nextLine()[0])
            nextLine()
            const x2 = parseFloat(nextLine()[0])
            nextLine()
            const y2 = parseFloat(nextLine()[0])
            segments.push([x1, y1, x2, y2])
        }
    }
    return segments
}

// const trimAll = (s: string) =>
//     s
//         .replace(/\s+/g, ' ')
//         .replace(/^\s+|\s+$/, '')
//         .replace('\t', ' ')
//         .trimEnd()
