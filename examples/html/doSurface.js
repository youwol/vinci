attributes = []

function doSurface(df, info) {
    let position = df.series.positions
    let indices  = df.series.indices

    if (!position || !indices) return

    const manager = new dataframe.Manager(df, [
        new math.PositionDecomposer,       // x y z
        new math.ComponentDecomposer,      // Ux Uy Uz Sxx Sxy Sz Syy Syz Szz
        new math.VectorNormDecomposer,     // U
        new math.EigenValuesDecomposer,    // S1 S2 S3
        new math.EigenVectorsDecomposer,   // S1 S2 S3
    ])

    {
        if (info.deformation.active===true) {
            const V = manager.serie(3, info.deformation.attr)
            if (V) {
                const s = info.deformation.scale
                position = dataframe.map([position, V], ([p,v]) => {
                    return [p[0]+v[0]*s, p[1]+v[1]*s, p[2]+v[2]*s]
                })
            }
        }
    }
    
    attributes = manager.names(1)

    let attr = undefined
    
    if (info.attr) {
        attr = manager.serie(1, info.attr)
    }

    if (attr) {
        const mM = math.minMaxArray(attr.array)
        if (info.iso.useMinMax === false) {
            isoParams.min = mM[0]//.toFixed(5)
            isoParams.max = mM[1]//.toFixed(5)
        }
    }

    // surface
    const surface = kepler.createSurface({
        positions: position,
        indices: df.series['indices'],
        parameters: new kepler.SurfaceParameters({
            flat: info.surface.flat,
            wireframe: false,
            color: info.surface.color !== undefined ? info.surface.color : scolor,
            opacity: info.surface.opacity,
            creaseAngle: info.surface.creaseAngle
        })
    })
    //surface.castShadow = true

    if (info.surface.show) {
        group.add(surface)
        if (attr) {
            kepler.paintAttribute(surface, attr, new kepler.PaintParameters({
                atVertex: true,
                lut: info.lut,
                duplicateLut: info.duplicateLut,
                reverseLut: info.reverseLut
            }))
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

    if (info.points && info.points.show) {
        const g = new THREE.Group
        group.add(g)
        g.translateZ(0.01)

        const points = kepler.createPointset({
            position: position,
            parameters: new kepler.PointsetParameters({
                size: info.points.color !== undefined ? info.points.size : 1,
                color: info.points.color !== undefined ? info.points.color : undefined
            })
        })
        g.add(points)
    }

    if (info.streamlines !== undefined && info.streamlines.show === true) {
        const vattr = manager.serie(3, info.streamlines.attr)
        console.log( math.minMax(vattr) )
        if (vattr) {
            let positions = dataframe.Serie.create({
                array: surface.geometry.attributes.position.array,
                itemSize: 3
            })
            let Z = positions.array[2]
            const indices = dataframe.Serie.create({
                array: surface.geometry.index.array,
                itemSize: 3
            })
            const lines = geom.generateStreamLinesFromUnstructured({
                positions,
                indices,
                vectorField: vattr,
                // nx: 100, 
                // ny: 100, 
                maximumPointsPerLine: info.streamlines.maximumPointsPerLine!==undefined?info.streamlines.maximumPointsPerLine:50,
                dSep: info.streamlines.dSep!==undefined?info.streamlines.dSep:0.2,
                timeStep: info.streamlines.timeStep!==undefined?info.streamlines.timeStep:0.01,
                dTest: info.streamlines.dTest!==undefined?info.streamlines.dTest:0.08,
                maxTimePerIteration: info.streamlines.maxTimePerIteration!==undefined?info.streamlines.maxTimePerIteration:1000
            })
            if (lines) {
                const g = new THREE.Group
                lines.forEach(line => {
                    line.series.positions = line.series.positions.map( p => [p[0], p[1], Z])
                    let pos = dataframe.Serie.create({
                        array: dataframe.createTyped(Float32Array, line.series.positions.array, false),
                        itemSize: 3
                    })
                    g.add( kepler.createLineset({
                        position: pos,
                        parameters: new kepler.LinesetParameters({
                            color: '#000'
                        })
                    }) )
                })
                if (info.streamlines.translate) {
                    g.translateX(info.streamlines.translate[0])
                    g.translateY(info.streamlines.translate[1])
                    g.translateZ(info.streamlines.translate[2])
                }
                group.add(g)
            }
        }
        else {
            console.warn('cannot find stream attribute' + info.streamlines.attr)
        }
    }

    if (attr && info.iso) {
        let min = info.iso.min
        let max = info.iso.max

        if (info.iso.useMinMax === false) {
            const minmax = dataframe.array.minMax(attr.array)
            min = minmax[0]
            max = minmax[1]
        }

        let iso = undefined    
        if (info.iso.spacing) {
            isos = kepler.generateIsosBySpacing(min, max, info.iso.spacing)
        }
        else if (info.iso.nb) {
            isos = kepler.generateIsos(min, max, info.iso.nb)
        }
        else if (info.iso.list) {
            isos = kepler.generateIsos(min, max, info.iso.list)
        }
        
        if (info.iso.show && isos) {
            const iso = kepler.createIsoContours(
                surface,
                attr, {
                parameters: new kepler.IsoContoursParameters({
                    color       : '#ffffff',
                    lineColor   : '#000000',
                    isoList     : isos,
                    filled      : info.iso.showFill,
                    lined       : info.iso.showLines,
                    opacity     : info.iso.opacity,
                    lut         : info.lut,
                    reverseLut  : info.reverseLut,
                    duplicateLut: info.duplicateLut,
                    min,
                    max
                })
            })
            group.add(iso)
        }
    }

    if (info.bands !== undefined && Array.isArray(info.bands)) {
        info.bands.forEach( sband => {
            if (manager.contains(1, sband.attr)) {
                const attr = manager.serie(1, sband.attr)
                console.log(sband.attr, math.minMax(attr))
                const band = kepler.createBand(surface, attr, {
                    parameters: new kepler.BandParameters({
                        color: sband.color,
                        from : sband.from,
                        to   : sband.to,
                        scale: sband.scale
                    })
                })
                if (sband.translate) {
                    band.translateX(sband.translate[0])
                    band.translateY(sband.translate[1])
                    band.translateZ(sband.translate[2])
                }
                group.add(band)
            }
            else {
                console.warn('attr', sband.attr, 'does not exist for band.\nPossible names are')
                console.warn(manager.names(1))
            }
        })
    }
}
