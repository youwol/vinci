GUI = lil.GUI

gridSampling = 50

obj = {
    models: "kink",
    S1: 0,
    S2: -1,
    theta: 0,
    bc: 'tt',
    gridSize: 3,
    showIsoLines: true,
    showPoints: false,
    lineSize: 0.002,
    screenshot() { takeScreenshot() },
    fullscreen() { fullScreen() },
    upload() {
        document.getElementById('upload').click()
    },
    optim: true
}

const isoParams = {
    attribute: 'Ux',
    colorTable: 'Insar',
    nbIso: 20,
    min: 0,
    max: 0,
    userMinMax: false
}

const def = {
    show : false,
    scale: 1
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
                model.gridSampling = 40
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

    const display = gui.addFolder('Display Grid')
    display.add(isoParams, 'attribute', attributes).name('Attribute').onChange(value => {
        surfaceInfo.attr = value
        repaint()
    })

    kepler.getColorMapNames().forEach(name => {
        kepler.ColorMap.addColorMap(name, kepler.getColorMap(name, 40, false).colors)
    })
    const colorTables = kepler.colorMapNames()
    display.add(isoParams, 'colorTable', colorTables).name('Color table').onChange(value => {
        surfaceInfo.lut = value
        repaint()
    })

    display.add(isoParams, 'nbIso', 2, 200, 1 ).name('Nb isos').onChange( value => {
        surfaceInfo.iso.nb = value
        repaint()
    })

    display.add(isoParams, 'userMinMax').name('User min/max').onChange( value => {
        surfaceInfo.iso.useMinMax = value
        if (value) {
            minGui.enable()
            maxGui.enable()
            minGui.listen(false)
            maxGui.listen(false)
            surfaceInfo.iso.min = minGui.getValue()
            surfaceInfo.iso.max = maxGui.getValue()
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
        if (surfaceInfo.iso.useMinMax ===  true) {
            surfaceInfo.iso.min = value
            repaint()
        }
    })
    maxGui = display.add(isoParams, 'max').name('Max').listen().disable().onChange( value => {
        if (surfaceInfo.iso.useMinMax ===  true) {
            surfaceInfo.iso.max = value
            repaint()
        }
    })

    // display.add(obj, "showIso").name('Show iso').onChange( value => {
    //     surfaceInfo.iso.showFill = value
    //     repaint()
    // })

    display.add(obj, "showIsoLines").name('Show iso-lines').onChange( value => {
        surfaceInfo.iso.showLines = value
        repaint()
    })

    display.add(obj, "showPoints").name('Show points').onChange( value => {
        surfaceInfo.points.show = value
        repaint()
    })
    // display.close()

    // =======================================

    const deform = gui.addFolder('Deform')
    deform.add(def, 'show').name('Active').onChange(value => {
        surfaceInfo.deformation.active = value
        repaint()
    })
    deform.add( def, 'scale', 0.1, 10, .1 ).name('Scaling').onChange( value => {
        surfaceInfo.deformation.scale = value
        repaint()
    })
    deform.close()

    // =======================================

    const displayL = gui.addFolder('Display Line')
    displayL.add( obj, 'lineSize', 0.0001, 0.05, 0.001).name('Line width').onChange( value => {
        lineInfo.width = value
        repaint()
    })
    displayL.addColor(colorLine, 'string').name('Color').onChange(value => {
        console.log(value)
        lineInfo.color = value
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
    general.close()
}