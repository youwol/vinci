GUI = lil.GUI

console.log('ADD A INSAR FRINGES WITH STATTELITE ORIENTATION !!!')

gridSampling = 50

obj = {
    models: "kink",
    S1: 0,
    S2: -1,
    theta: 0,
    bc: 'tt',
    gridSize: 3,
    screenshot() { takeScreenshot() },
    fullscreen() { fullScreen() },
    upload() {
        document.getElementById('upload').click()
    },
    optim: true,
    optimSampling: 20
}

const surfParams = {
    show: false,
    flat: false,
    color: '#aaaaaa',
    opacity: 1,
    creaseAngle: 1,
    showPoints: false,
    pointSize: 1,
    pointColor: '#ffffff'
}

const isoParams = {
    show: true,
    attr: 'Ux',

    lut: 'Insar',
    duplicateLut: 1,
    reverseLut: false,

    opacity: 1,

    nb: 20,
    userMinMax: false,
    min: 0,
    max: 0,
    showFill: true,
    showLines: true,
    lineWidth: 0.002
}

const faultParams = {
    show: true,
    width: 0.005,
    color: '#000000'
}

const def = {
    show : false,
    scale: 1,
    attr: 'U'
}

const streamLines = {
    show: false,
    attr: 'U',
    color: '#000000',
    maximumPointsPerLine: 50,
    dSep: 0.2,
    timeStep: 0.1,
    dTest: 0.1,
    maxTimePerIteration: 100,
    translate: [0,0,0.1],
    width: 0.001
}

function connectGui() {

    const colorBack = {
        string: '#aaaaaa',
        int: 0xaaaaaa,
        object: { r: 1, g: 1, b: 1 },
        array: [1, 1, 1]
    }

    const colorLine = {
        string: '#000000',
        int: 0x000000,
        object: { r: 0, g: 0, b: 0 },
        array: [0, 0, 0]
    }

    const colorStream = {
        string: '#000000',
        int: 0x000000,
        object: { r: 0, g: 0, b: 0 },
        array: [0, 0, 0]
    }

    const upload = document.getElementById('upload')
    upload.onchange = () => {
        upload.files[0].arrayBuffer().then(arrayBuffer => {
            // console.log(new TextDecoder().decode(arrayBuffer))
            const filter = io.IOFactory.getFilter('test.pl') // fake filename in order to have the filter
            const dfs = filter.decode(new TextDecoder().decode(arrayBuffer), {shared: false, merge: true})
            // console.log(dfs)
            scene.remove(group)
            group = new three.Group
            scene.add(group)
            curDfs = dfs
            regenerateModel()
            extra.changeView('up', { scene, camera, controls })
        })
    }

    gui = new GUI({
        container: document.getElementById( 'gui' ),
        autoPlace: true,
        title: 'Control panel'
    })

    function repaint() {
        scene.remove(group)
        group = new three.Group
        scene.add(group)
        regenerateModel()
    }

    gui.onChange( event => {
        if (obj.optim) {
            if (event.property !== 'gridSampling') {
                model.gridSampling = obj.optimSampling
            }
        }
    })
    gui.onFinishChange( _ => {
        if (obj.optim) {
            model.gridSampling = gridSampling
            repaint()
        }
    })

    // =======================================

    const mod = gui.addFolder('Model')
    mod.add( obj, "models", modelNames).name("Name").onChange( value => {
        curModel = value
        curDfs = undefined
        repaint()
        extra.changeView('up', { scene, camera, controls })
    })

    mod.add( obj, "upload")

    mod.add( obj, 'bc', ['tt', 'tb', 'bt', 'bb']).name('Boundary conditions').onChange( value => {
        bc = value
        repaint()
    })

    mod.add( obj, 'S1', -10, 10, .1 ).name('σx').onChange( value => {
        S1 = value
        repaint()
    })

    mod.add( obj, 'S2', -10, 10, .1 ).name('σy').onChange( value => {
        S2 = value
        repaint()
    })

    mod.add( obj, 'theta', 0, 180, 1 ).name('Theta').onChange( value => {
        theta = value
        repaint()
    })

    mod.add( obj, 'gridSize', 1, 10, .5 ).name('Grid extend').onChange( value => {
        model.gridExtend = value
        repaint()
    })

    mod.add( model, 'gridSampling', 10, 500, 1 ).name('Grid sampling').onChange( value => {
        gridSampling = value
        model.gridSampling = value
        repaint()
    })

    // =======================================

    const display = gui.addFolder('Iso-contours')
    display.add( isoParams, 'show').name('Show')

    display.add(isoParams, 'attr', attributes).name('Attribute').onChange(value => {
        isoParams.attr = value
        repaint()
    }).listen()

    kepler.getColorMapNames().forEach(name => {
        kepler.ColorMap.addColorMap(name, kepler.getColorMap(name, 40, false).colors)
    })
    const colorTables = kepler.colorMapNames()
    display.add(isoParams, 'lut', colorTables).name('Color table').onChange(value => {
        isoParams.lut = value
        repaint()
    }).listen()

    display.add(isoParams, 'nb', 2, 200, 1 ).name('Nb isos').onChange( value => {
        // iso.nb = value
        repaint()
    })

    display.add(isoParams, 'userMinMax').name('User min/max').onChange( value => {
        // iso.useMinMax = value
        if (value) {
            minGui.enable()
            maxGui.enable()
            minGui.listen(false)
            maxGui.listen(false)
            isoParams.min = minGui.getValue()
            isoParams.max = maxGui.getValue()
        }
        else {
            minGui.disable()
            maxGui.disable()
            minGui.listen(true)
            maxGui.listen(true)
        }
        repaint()
    })

    minGui = display.add(isoParams, 'min').name('Min').listen().disable().onChange( value => {
        if (isoParams.useMinMax ===  true) {
            isoParams.min = value
            repaint()
        }
    })
    maxGui = display.add(isoParams, 'max').name('Max').listen().disable().onChange( value => {
        if (isoParams.useMinMax ===  true) {
            isoParams.max = value
            repaint()
        }
    })

    // display.add(obj, "showIso").name('Show iso').onChange( value => {
    //     surfaceInfo.iso.showFill = value
    //     repaint()
    // })

    display.add(isoParams, "showLines").name('Show iso-lines').onChange( value => {
        // surfaceInfo.iso.showLines = value
        repaint()
    })

    display.add(surfParams, "showPoints").name('Show points').onChange( value => {
        // surfaceInfo.points.show = value
        repaint()
    })
    display.add(surfParams, "pointSize", 1, 10, 1).name('Points size').onChange( value => {
        // surfaceInfo.points.show = value
        repaint()
    })
    display.close()

    // =======================================

    /*
    maximumPointsPerLine: 50,
    dSep: 0.1,
    timeStep: 0.05,
    dTest: 0.08,
    maxTimePerIteration: 1000,
    */
    const stream = gui.addFolder('StreamLines')
    stream.add( streamLines, 'show').name('Show').onChange( value => repaint() ).disable()
    stream.add( streamLines, 'width').name('Width', 0.0001, 0.01, 0.001).onChange( value => repaint() )
    stream.addColor(colorStream, 'string').name('Color').onChange(value => {
        streamLines.color = value
        repaint()
    })
    stream.add( streamLines, 'maximumPointsPerLine', 5, 200, 5).onChange( value => repaint() )
    stream.add( streamLines, 'dSep', 0.01, 1, 0.1).onChange( value => repaint() )
    stream.add( streamLines, 'timeStep', 0.01, 0.5, 0.01).onChange( value => repaint() )
    stream.add( streamLines, 'dTest', 0.01, 0.5, 0.01).onChange( value => repaint() )
    stream.add( streamLines, 'maxTimePerIteration', 10, 100, 10).onChange( value => repaint() )
    stream.close()
    // stream.hide()

    // =======================================

    const deform = gui.addFolder('Deform')
    deform.add(def, 'show').name('Active').onChange(value => {
        // surfaceInfo.deformation.active = value
        repaint()
    })
    deform.add( def, 'scale', 0.1, 10, .1 ).name('Scaling').onChange( value => {
        // surfaceInfo.deformation.scale = value
        repaint()
    })
    deform.close()

    // =======================================

    const displayL = gui.addFolder('Fault(s)')
    displayL.add( faultParams, 'width', 0.0001, 0.05, 0.001).name('Line width').onChange( value => {
        // lineInfo.width = value
        repaint()
    })
    displayL.addColor(colorLine, 'string').name('Color').onChange(value => {
        // console.log(value)
        // faultParams.color = value
        repaint()
    })
    displayL.close()

    // =======================================

    const general = gui.addFolder('General');
    general.addColor(colorBack, 'string').name('Background').onChange(value => {
        extra.changeBackground({ scene, color: value })
    })
    general.add(obj, 'screenshot').name('Take screenshot')
    general.add(obj, 'fullscreen').name('Fullscreen on/off')
    general.add(obj, 'optim').name('Optimization')
    general.add(obj, 'optimSampling').name('Optimization sampling')
    general.close()

    // ======================================

    const mohrr = {
        S1: 2,
        S2: 1,
        S3: 0.5
    }
    function checkM() {
        if (mohrr.S1 < mohrr.S2) mohrr.S2 = mohrr.S1
        if (mohrr.S2 < mohrr.S3) mohrr.S3 = mohrr.S2
    }
    const mohr = gui.addFolder('Mohr');
    mohr.add(mohrr, 'S1', 0, 10, 0.1).onChange(value => {
        mohrr.S1 = value
        checkM()
        mohrCircle({element: "mohr", width : 200, height: 200, S1: mohrr.S1, S2: mohrr.S2, S3: mohrr.S3, scale: 80})
    }).listen()

    mohr.add(mohrr, 'S2', 0, 10, 0.1).onChange(value => {
        mohrr.S2 = value
        checkM()
        mohrCircle({element: "mohr", width : 200, height: 200, S1: mohrr.S1, S2: mohrr.S2, S3: mohrr.S3, scale: 80})
    }).listen()

    mohr.add(mohrr, 'S3', 0, 10, 0.1).onChange(value => {
        mohrr.S3 = value
        checkM()
        mohrCircle({element: "mohr", width : 200, height: 200, S1: mohrr.S1, S2: mohrr.S2, S3: mohrr.S3, scale: 80})
    }).listen()

    mohr.close()

    // ======================================

    const ofringes = {
        show: false,
        azym: 0,
        decli: 90,
        spacing: 0.01
    }
    
    const fringes = gui.addFolder('Insar')
    fringes.add( ofringes, 'show').name('Show')
    fringes.add(ofringes, 'azym', 0, 180, 1).name('Sat azymuth').onChange(value => {
    }).listen()
    fringes.add(ofringes, 'decli', 0, 90, 1).name('Sat declination').onChange(value => {
    }).listen()
    fringes.add(ofringes, 'spacing', 0.0001, 0.1, 0.001).name('Fringes spacing').onChange(value => {
    }).listen()

    
}