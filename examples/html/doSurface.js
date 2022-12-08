attributes = []
vattributes = []

function doSurface(df, info) {
    let position = df.series.positions
    let indices = df.series.indices

    if (!position || !indices) return

    const manager = new dataframe.Manager(df, {
        decomposers: [
            new math.PositionDecomposer(), // x y z
            new math.ComponentDecomposer(), // Ux Uy Uz Sxx Sxy Sz Syy Syz Szz
            new math.VectorNormDecomposer(), // U
            new math.EigenValuesDecomposer(), // S1 S2 S3
            new math.EigenVectorsDecomposer(), // S1 S2 S3
        ],
        dimension: 2,
    })

    {
        if (def.show === true) {
            const V = manager.serie(3, def.attr)
            if (V) {
                const s = def.scale
                position = dataframe.map([position, V], ([p, v]) => {
                    return [p[0] + v[0] * s, p[1] + v[1] * s, p[2] + v[2] * s]
                })
            }
        }
    }

    attributes = manager.names(1)
    vattributes = manager.names(2)

    let attr = undefined

    if (isoParams.attr) {
        attr = manager.serie(1, isoParams.attr)
    }

    if (attr) {
        const mM = math.minMaxArray(attr.array)
        if (isoParams.userMinMax === false) {
            isoParams.min = mM[0] //.toFixed(5)
            isoParams.max = mM[1] //.toFixed(5)
        }
    }

    // surface
    const surface = kepler.createSurface({
        positions: position,
        indices: df.series['indices'],
        parameters: new kepler.SurfaceParameters({
            flat: surfParams.flat,
            wireframe: false,
            color: surfParams.color !== undefined ? surfParams.color : scolor,
            opacity: surfParams.opacity,
            creaseAngle: surfParams.creaseAngle,
        }),
    })
    //surface.castShadow = true

    if (surfParams.show) {
        group.add(surface)
        if (attr) {
            kepler.paintAttribute(
                surface,
                attr,
                new kepler.PaintParameters({
                    atVertex: true,
                    lut: isoParams.colorTable,
                    duplicateLut: isoParams.duplicateLut,
                    reverseLut: isoParams.reverseLut,
                }),
            )
        }
    }

    // if (info.borders && info.borders.show) {
    //     // const borders = createSurfaceBorders(df, info.borders.color)
    //     const borders = kepler.createSurfaceBorders({
    //         mesh: surface,
    //         parameters: new kepler.LinesetParameters({
    //             color: info.borders.color,
    //             useTube: info.borders.useTube !== undefined ? info.borders.useTube : false,
    //             tubeRadius: info.borders.tubeRadius !== undefined ? info.borders.tubeRadius : 1
    //         })
    //     })
    //     group.add(borders)
    // }

    if (surfParams.showPoints) {
        const g = new THREE.Group()
        group.add(g)
        g.translateZ(0.01)

        const points = kepler.createPointset({
            position: position,
            parameters: new kepler.PointsetParameters({
                size: surfParams.pointSize,
                color: surfParams.pointColor,
            }),
        })
        g.add(points)
    }

    if (streamLines !== undefined && streamLines.show === true) {
        const vattr = manager.serie(3, streamLines.attr)
        console.log(math.minMax(vattr))
        if (vattr) {
            let positions = dataframe.Serie.create({
                array: surface.geometry.attributes.position.array,
                itemSize: 3,
            })
            let Z = positions.array[2]
            const indices = dataframe.Serie.create({
                array: surface.geometry.index.array,
                itemSize: 3,
            })
            const lines = geom.generateStreamLinesFromUnstructured({
                positions,
                indices,
                vectorField: vattr,
                // nx: 100,
                // ny: 100,
                maximumPointsPerLine:
                    streamLines.maximumPointsPerLine !== undefined
                        ? streamLines.maximumPointsPerLine
                        : 50,
                dSep: streamLines.dSep !== undefined ? streamLines.dSep : 0.2,
                timeStep:
                    streamLines.timeStep !== undefined
                        ? streamLines.timeStep
                        : 0.01,
                dTest:
                    streamLines.dTest !== undefined ? streamLines.dTest : 0.08,
                maxTimePerIteration:
                    streamLines.maxTimePerIteration !== undefined
                        ? streamLines.maxTimePerIteration
                        : 1000,
            })
            if (lines) {
                const g = new THREE.Group()
                lines.forEach((line) => {
                    line.series.positions = line.series.positions.map((p) => [
                        p[0],
                        p[1],
                        Z,
                    ])
                    let pos = dataframe.Serie.create({
                        array: dataframe.createTyped(
                            Float32Array,
                            line.series.positions.array,
                            false,
                        ),
                        itemSize: 3,
                    })
                    // g.add( kepler.createLineset({
                    //     position: pos,
                    //     parameters: new kepler.LinesetParameters({
                    //         color: '#000'
                    //     })
                    // }) )

                    // console.log(streamLines)

                    g.add(
                        kepler.createLineset2({
                            position: pos,
                            parameters: {
                                color: streamLines.color,
                                width: streamLines.width,
                            },
                        }),
                    )

                    g.add(
                        kepler.createLineset2({
                            position: pos,
                            parameters: {
                                width: streamLines.width,
                                color: streamLines.color,
                                opacity: 1,
                                dashed: false,
                                dashScale: 0.1,
                            },
                        }),
                    )
                })
                if (streamLines.translate) {
                    g.translateX(streamLines.translate[0])
                    g.translateY(streamLines.translate[1])
                    g.translateZ(streamLines.translate[2])
                }
                group.add(g)
            }
        } else {
            console.warn('cannot find stream attribute' + streamLines.attr)
        }
    }

    if (attr && isoParams.show === true) {
        let min = isoParams.min
        let max = isoParams.max

        if (isoParams.userMinMax === false) {
            const minmax = dataframe.array.minMax(attr.array)
            min = minmax[0]
            max = minmax[1]
        }

        let isos = undefined
        if (isoParams.spacing) {
            isos = kepler.generateIsosBySpacing(min, max, isoParams.spacing)
        } else if (isoParams.nb) {
            isos = kepler.generateIsos(min, max, isoParams.nb)
        } else if (isoParams.list) {
            isos = kepler.generateIsos(min, max, isoParams.list)
        }

        if (isos) {
            const iso = kepler.createIsoContours(surface, attr, {
                parameters: new kepler.IsoContoursParameters({
                    color: '#ffffff',
                    lineColor: '#000000',
                    isoList: isos,
                    filled: isoParams.showFill,
                    lined: isoParams.showLines,
                    opacity: isoParams.opacity,
                    lut: isoParams.lut,
                    reverseLut: isoParams.reverseLut,
                    duplicateLut: isoParams.duplicateLut,
                    min,
                    max,
                }),
            })
            group.add(iso)
        }
    }

    if (info.vectors !== undefined && info.vectors.show === true) {
        const vattr2D = manager.serie(2, info.vectors.attr)

        // Convert the 2D vector field into 3D !
        // const vattr = vattr2D.newInstance({
        //     count     : vattr2D.count*3/2,
        //     itemSize  : vattr2D.itemSize,
        //     initialize: false
        // })
        let vattr = dataframe.createEmptySerie({
            Type: Float32Array,
            count: vattr2D.count,
            itemSize: 3,
            dimension: 3,
            shared: false,
        })
        for (let i = 0; i < vattr.count; ++i) {
            vattr.setItemAt(i, [...vattr2D.itemAt(i), 0])
        }

        if (info.vectors.normalize) {
            vattr = math.normalize(vattr)
        }

        if (vattr) {
            if (info.vectors.useTube) {
                group.add(
                    kepler.createTubeVectors({
                        geometry: surface.geometry,
                        vectorField: vattr,
                        parameters: new kepler.TubeVectorsParameters({
                            scale: info.vectors.scale,
                            color: info.vectors.color,
                            radius: info.vectors.radius,
                            centered: info.vectors.centered,
                        }),
                    }),
                )
            } else {
                group.add(
                    kepler.createVectors({
                        geometry: surface.geometry,
                        vectorField: vattr,
                        parameters: new kepler.TubeVectorsParameters({
                            scale: info.vectors.scale,
                            color: info.vectors.color,
                            centered: info.vectors.centered,
                        }),
                    }),
                )
            }
        } else {
            console.warn('cannot find vector attribute ' + info.vectors.attr)
        }
    }
}
