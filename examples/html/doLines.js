function doLines(dfs, lineInfo) {
    dfs.forEach((df) => {
        lineDataframe.push(df)

        if (lineInfo.show) {
            // let position = df.series.positions
            if (lineInfo.translate) {
                const t = lineInfo.translate
                df.series.positions = dataframe.apply(
                    df.series.positions,
                    (p) => [p[0] + t[0], p[1] + t[1], p[2] + t[2]],
                )
            }
            // console.log('min-max position pointset:', math.minMax(position) )

            const manager = new dataframe.Manager(df, {
                decomposers: [
                    new math.PositionDecomposer(), // x y z
                    new math.ComponentDecomposer(), // Ux Uy Uz Sxx Sxy Sz Syy Syz Szz
                    new math.VectorNormDecomposer(), // U
                    new math.EigenValuesDecomposer(), // S1 S2 S3
                    new math.EigenVectorsDecomposer(), // S1 S2 S3
                ],
                dimension: 3,
            })

            let skin = kepler.createLineset2({
                position: df.series.positions,
                parameters: {
                    width: lineInfo.width ? lineInfo.width : 1,
                    color: lineInfo.color,
                    opacity:
                        lineInfo.opacity !== undefined ? lineInfo.opacity : 1,
                    dashed:
                        lineInfo.dashed !== undefined ? lineInfo.dashed : false,
                    dashScale:
                        lineInfo.dashScale !== undefined
                            ? lineInfo.dashScale
                            : 0.1,
                },
            })
            group.add(skin)

            if (lineInfo.attr) {
                const attrName = lineInfo.attr
                const attr = manager.serie(1, attrName)
                if (attr) {
                    kepler.paintAttribute(
                        skin,
                        attr,
                        new kepler.PaintParameters({
                            atVertex: true,
                            lut:
                                lineInfo.lut !== undefined
                                    ? lineInfo.lut
                                    : 'insar',
                            reverseLut:
                                lineInfo.reverseLut !== undefined
                                    ? lineInfo.reverseLut
                                    : false,
                        }),
                    )
                }
            }
            if (lineInfo.showPoints) {
                const SKIN = kepler.createPointset({
                    position: df.series.positions,
                    parameters: new kepler.PointsetParameters({
                        size: lineInfo.pointSize,
                        color: lineInfo.pointColor,
                        // sizeAttenuation: true
                    }),
                })

                if (SKIN) group.add(SKIN)
            }
        }
    })
}

function updateLines() {
    lines.clear()
    lineDataframe.forEach((df) => createGlLine(df, plines))
}

function createGlLine(df, lineInfo) {
    const manager = new dataframe.Manager(df, {
        decomposers: [
            new math.PositionDecomposer(), // x y z
            new math.ComponentDecomposer(), // Ux Uy Uz Sxx Sxy Sz Syy Syz Szz
            new math.VectorNormDecomposer(), // U
            new math.EigenValuesDecomposer(), // S1 S2 S3
            new math.EigenVectorsDecomposer(), // S1 S2 S3
        ],
        dimension: 3,
    })

    let skin = kepler.createLineset2({
        position: df.series.positions,
        parameters: {
            width: lineInfo.width,
            color: lineInfo.color,
            opacity: lineInfo.opacity,
        },
    })
    lines.add(skin)

    if (lineInfo.attr) {
        const attrName = lineInfo.attr
        const attr = manager.serie(1, attrName)
        if (attr) {
            kepler.paintAttribute(
                skin,
                attr,
                new kepler.PaintParameters({
                    atVertex: true,
                    lut: lineInfo.lut !== undefined ? lineInfo.lut : 'insar',
                    reverseLut:
                        lineInfo.reverseLut !== undefined
                            ? lineInfo.reverseLut
                            : false,
                }),
            )
        }
    }
}
