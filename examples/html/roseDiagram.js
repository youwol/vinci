
function roseDiagram({
    data,
    element,
    width, 
    height, 
    margin = {
        top   : 40, 
        right : 80, 
        bottom: 40, 
        left  : 40
    }, 
    innerR = 40, 
    binArc = 10, 
    colourFill = "#1d55cf", 
    gradTickSpacing = 7, 
    colourHover = "purple"
}) {

    const svg = d3.select(`#${element}`)
        .html(null) // clear the element
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    // const svg = d3.create('svg')
    //     .attr('width', width)
    //     .attr('height', height)

    const chartWidth  = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const outerR = (Math.min(chartWidth, chartHeight) / 2)

    let g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    let angle = d3.scaleLinear()
        .domain([0, 12])
        .range([0, 2 * Math.PI])

    let radius = d3.scaleLinear()
        .range([innerR, outerR])

    let y = d3.scaleLinear()
        .range([innerR, outerR])

    let labelHead = ["N", "E", "S", "W"]

    // Bin the data ranging from 0 to 180 and create its symmetric data from 180 to 360
    let dataRose = binSerie(data, binArc)
    let dataRoseSym = dataRose.map((d, i) => {
        return {
            startAngle: d.startAngle + Math.PI,
            endAngle: d.endAngle + Math.PI,
            freq: d.freq
        }
    })

    let children = dataRose.concat(dataRoseSym)

    // scale of 4 cardinal points
    let x = d3.scaleBand()
        .domain(labelHead)
        .range([0, 2 * Math.PI])
        .align(0)

    // Range and domain of the frequence for rose diagram
    let freq = d3.scaleLinear()
        .domain([0, d3.max(dataRose, d => d.freq)])
        .range([innerR, outerR])
    // Extend the domain slightly to match the range of [0, 2π]

    radius.domain([0, d3.max(dataRose, d => {
        return d.y0 + d.y;
    })])

    // Plot the arc for each datum 0-360 degrees
    g.append("g")
        .selectAll('path')
        .data(children)
        .join('path')
        .attr('d', d3.arc()
            .innerRadius(d => freq(d.freq))
            .outerRadius(innerR)
            .padAngle(.01)
            .padRadius(20))
        .attr('stroke', 'black')
        .style("fill", colourFill)
        .join('path')
        .on("mouseover", onMouseOver) //Add listener for the mouseover event
        .on("mouseout", onMouseOut)

    // Add outer black circle
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', outerR)
        .attr('stroke', 'black')
        .style('fill', 'none')

    // Add inner black circle 
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', innerR)
        .attr('stroke', 'black')
        .style('fill', 'none')

    // Add label cardinal heading NESW
    let label = g.append("g")
        .selectAll("g")
        .data(labelHead)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", d => { return "rotate(" + (x(d) * 180 / Math.PI - 90) + ")translate(" + (outerR + 30) + ",0)"; })
        .attr("font-family", "Aldrich")//Aldrich

    // put upright cardinal points
    label.append("text")
        .attr("transform", d => { return (x(d) * 180 / Math.PI - 90) == 90 ? "rotate(-90)translate(0,0)" : "rotate(" + (x(d) * 180 / Math.PI - 90) + ")translate(0,5)"; })
        .text(d => d)
        .style("font-size", 14);

    // Add radius line    
    g.selectAll(".axis")
        .data(d3.range(angle.domain()[1]))
        .enter().append("g")
        .attr("class", "axis")
        .attr("stroke-width", 0.5)
        .attr("transform", d => { return "rotate(" + angle(d) * 180 / Math.PI + ")"; })
        .style("opacity", .2)
        .call(d3.axisLeft()
            .tickSizeOuter(0)
            .scale(radius.copy().range([-innerR, -(outerR)])))

    // Add circular tick with frequency values    
    let yAxis = g.append("g")
        .attr("text-anchor", "middle")


    var yTick = yAxis
        .selectAll("g")
        .data(freq.ticks(gradTickSpacing).slice(1))
        .enter().append("g");

    yTick.append("circle")
        .attr("fill", "none")
        .attr("stroke", "gray")
        .style("opacity", .2)
        .attr("r", freq);

    yTick.append("text")
        .attr("y", d => -freq(d))
        .attr("dy", "-0.25em")
        .attr("x", function () { return -15; })
        .text(freq.tickFormat(5, "s"))
        .style("font-size", 12);

    // Add animation to show values of each Arc when hovering it
    function onMouseOver(event, datum) {
        let arc = d3.select(this)
        arc.style("fill", colourHover)
        arc.transition()
            .duration(200)
            .attr('d', d3.arc()
                .innerRadius(d => freq(d.freq))
                .outerRadius(innerR)
                .startAngle(d => d.startAngle)
                .endAngle(d => d.endAngle)
                .padAngle(.01)
                .padRadius(20))
            .attr('stroke', 'black')
            .attr('stroke-width', '2.5')

        // g.append("text")
        //     .attr('class', 'val')
        //     .attr('x', 0)
        //     .attr('y', 0)
        //     .text(function () { return ["Bin range"] })

        // g.append("text")
        //     .attr('class', 'val')
        //     .attr('x', 0)
        //     .attr('y', 0)
        //     .text(function () { return ["[" + (datum.startAngle * 180 / Math.PI).toFixed(0) + "°" + ' - ' + (datum.endAngle * 180 / Math.PI).toFixed(0) + "°]"] })
    }

    function onMouseOut(d, i) {
        d3.select(this).style("fill", colourFill)
        d3.select(this)
            .transition()
            .duration(400)
            .attr('d', d3.arc()
                .innerRadius(d => freq(d.freq))
                .outerRadius(innerR)
                .startAngle(d => d.startAngle)
                .endAngle(d => d.endAngle)
                .padAngle(.01)
                .padRadius(20))
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
        d3.selectAll('.val')
            .remove()
    }

    return svg.node()

}

function binSerie(serie, nbBins) {
    const binned = new Array(nbBins).fill(undefined).map((v, i) => {
        return {
            startAngle: i * Math.PI / (nbBins),
            endAngle: (i + 1) * Math.PI / (nbBins),
            freq: 0
        }
    })
    const step = 180 / (nbBins - 1)
    serie.forEach(v => binned[Math.round(v / step)].freq++)
    return binned
}
