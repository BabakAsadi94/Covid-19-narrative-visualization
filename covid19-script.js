let currentScene = 0;
const scenes = document.querySelectorAll('.scene');

function navigate(offset) {
    scenes[currentScene].style.display = 'none';
    currentScene += offset;
    if (currentScene < 0) currentScene = scenes.length - 1;
    if (currentScene >= scenes.length) currentScene = 0;
    scenes[currentScene].style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    scenes.forEach(scene => scene.style.display = 'none');
    scenes[currentScene].style.display = 'block';
});

// Scene 1
d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
    // Prepare the data
    const countryData = d3.rollups(
        data,
        v => ({
            date: new Date(v[0].date),
            covid_cases: d3.sum(v, d => +d.covid_cases),
            cum_covid_cases: d3.sum(v, d => +d.cum_covid_cases),
            covid_deaths: d3.sum(v, d => +d.covid_deaths),
            cum_covid_deaths: d3.sum(v, d => +d.cum_covid_deaths),
            one_vax_dose: d3.sum(v, d => +d.one_vax_dose)
        }),
        d => d.date
    ).map(([key, value]) => value);

    // Scene 1: New Cases and Cumulative Cases Visualization
    const svg1 = d3.select("#scene1 #visualization1").append("svg").attr("width", 1200).attr("height", 600);
    const margin1 = { top: 20, right: 100, bottom: 60, left: 100 };
    const width1 = 1200 - margin1.left - margin1.right;
    const height1 = 600 - margin1.top - margin1.bottom;
    const xScale1 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width1]);
    const yScaleLeft1 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_cases)]).range([height1, 0]);
    const yScaleRight1 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_cases)]).range([height1, 0]);

    const xAxis1 = d3.axisBottom(xScale1);
    const yAxisLeft1 = d3.axisLeft(yScaleLeft1);
    const yAxisRight1 = d3.axisRight(yScaleRight1);

    const g1 = svg1.append("g").attr("transform", `translate(${margin1.left},${margin1.top})`);
    g1.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height1})`).call(xAxis1);
    g1.append("g").attr("class", "y-axis y-left").call(yAxisLeft1);
    g1.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width1},0)`).call(yAxisRight1);

    g1.append('text')
        .attr('class', 'y-axis-label-left')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin1.left + 30)
        .attr('x', -height1 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    g1.append('text')
        .attr('class', 'y-axis-label-right')
        .attr('transform', 'rotate(-90)')
        .attr('y', width1 + margin1.right - 20)
        .attr('x', -height1 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    g1.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width1 / 2)
        .attr('y', height1 + margin1.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Time');

    function updateScales1() {
        if (currentDataType === 'both') {
            yScaleLeft1.domain([0, d3.max(countryData, d => d.covid_cases)]);
            yScaleRight1.domain([0, d3.max(countryData, d => d.cum_covid_cases)]);
        } else {
            const yScaleDomain = d3.max(countryData, d => d[currentDataType]);
            yScaleLeft1.domain([0, yScaleDomain]);
            yScaleRight1.domain([0, yScaleDomain]);
        }
    }

    function updateLines1() {
        updateScales1();

        const lineLeft = d3.line()
            .x(d => xScale1(d.date))
            .y(d => yScaleLeft1(d[currentDataType === 'both' ? 'covid_cases' : currentDataType]))
            .curve(d3.curveMonotoneX);

        const lineRight = d3.line()
            .x(d => xScale1(d.date))
            .y(d => yScaleRight1(d[currentDataType === 'both' ? 'cum_covid_cases' : currentDataType]))
            .curve(d3.curveMonotoneX);

        g1.selectAll(".line").remove();

        if (currentDataType === 'both') {
            g1.append("path")
                .datum(countryData)
                .attr("class", "line left-line")
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("d", lineLeft);

            g1.append("path")
                .datum(countryData)
                .attr("class", "line right-line")
                .attr("fill", "none")
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("d", lineRight);
        } else {
            g1.append("path")
                .datum(countryData)
                .attr("class", "line left-line")
                .attr("fill", "none")
                .attr("stroke", currentDataType === 'covid_cases' ? "blue" : "red")
                .attr("stroke-width", 2)
                .attr("d", lineLeft);

            g1.append("path")
                .datum(countryData)
                .attr("class", "line right-line")
                .attr("fill", "none")
                .attr("stroke", currentDataType === 'cum_covid_cases' ? "green" : "orange")
                .attr("stroke-width", 2)
                .attr("d", lineRight);
        }

        g1.selectAll(".x-axis").call(xAxis1);
        g1.selectAll(".y-left").call(yAxisLeft1);
        g1.selectAll(".y-right").call(yAxisRight1);

        g1.select('.y-axis-label-left').text(currentDataType === 'covid_cases' ? 'New Cases' : 'New Deaths').style('fill', currentDataType === 'covid_cases' ? 'blue' : 'red');
        g1.select('.y-axis-label-right').text(currentDataType === 'cum_covid_cases' ? 'Cumulative Cases' : 'Cumulative Deaths').style('fill', currentDataType === 'cum_covid_cases' ? 'green' : 'orange');
    }

    d3.selectAll('#scene1 .button-group button[data-type]').on('click', function () {
        currentDataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene1 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateLines1();
    });

    d3.select('#scene1 #switch-y-axis').on('click', function () {
        if (yScaleLeft1.range()[0] === height1) {
            yScaleLeft1.range([height1, 0]);
            yScaleRight1.range([height1, 0]);
        } else {
            yScaleLeft1.range([0, height1]);
            yScaleRight1.range([0, height1]);
        }
        updateLines1();
    });

    updateLines1();
});

// Scene 2
d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
    // Prepare the data
    const countryData = d3.rollups(
        data,
        v => ({
            date: new Date(v[0].date),
            covid_cases: d3.sum(v, d => +d.covid_cases),
            cum_covid_cases: d3.sum(v, d => +d.cum_covid_cases),
            covid_deaths: d3.sum(v, d => +d.covid_deaths),
            cum_covid_deaths: d3.sum(v, d => +d.cum_covid_deaths),
            one_vax_dose: d3.sum(v, d => +d.one_vax_dose)
        }),
        d => d.date
    ).map(([key, value]) => value);

    // Scene 2: New Deaths and Cumulative Deaths Visualization
    const svg2 = d3.select("#scene2 #visualization2").append("svg").attr("width", 1200).attr("height", 600);
    const margin2 = { top: 20, right: 100, bottom: 60, left: 100 };
    const width2 = 1200 - margin2.left - margin2.right;
    const height2 = 600 - margin2.top - margin2.bottom;
    const xScale2 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width2]);
    const yScaleLeft2 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_deaths)]).range([height2, 0]);
    const yScaleRight2 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_deaths)]).range([height2, 0]);

    const xAxis2 = d3.axisBottom(xScale2);
    const yAxisLeft2 = d3.axisLeft(yScaleLeft2);
    const yAxisRight2 = d3.axisRight(yScaleRight2);

    const g2 = svg2.append("g").attr("transform", `translate(${margin2.left},${margin2.top})`);
    g2.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height2})`).call(xAxis2);
    g2.append("g").attr("class", "y-axis y-left").call(yAxisLeft2);
    g2.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width2},0)`).call(yAxisRight2);

    g2.append('text')
        .attr('class', 'y-axis-label-left')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin2.left + 30)
        .attr('x', -height2 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    g2.append('text')
        .attr('class', 'y-axis-label-right')
        .attr('transform', 'rotate(-90)')
        .attr('y', width2 + margin2.right - 20)
        .attr('x', -height2 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    g2.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width2 / 2)
        .attr('y', height2 + margin2.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Time');

    function updateScales2() {
        if (currentDataType === 'both') {
            yScaleLeft2.domain([0, d3.max(countryData, d => d.covid_deaths)]);
            yScaleRight2.domain([0, d3.max(countryData, d => d.cum_covid_deaths)]);
        } else {
            const yScaleDomain = d3.max(countryData, d => d[currentDataType]);
            yScaleLeft2.domain([0, yScaleDomain]);
            yScaleRight2.domain([0, yScaleDomain]);
        }
    }

    function updateLines2() {
        updateScales2();

        const lineLeft = d3.line()
            .x(d => xScale2(d.date))
            .y(d => yScaleLeft2(d[currentDataType === 'both' ? 'covid_deaths' : currentDataType]))
            .curve(d3.curveMonotoneX);

        const lineRight = d3.line()
            .x(d => xScale2(d.date))
            .y(d => yScaleRight2(d[currentDataType === 'both' ? 'cum_covid_deaths' : currentDataType]))
            .curve(d3.curveMonotoneX);

        g2.selectAll(".line").remove();

        if (currentDataType === 'both') {
            g2.append("path")
                .datum(countryData)
                .attr("class", "line left-line")
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("d", lineLeft);

            g2.append("path")
                .datum(countryData)
                .attr("class", "line right-line")
                .attr("fill", "none")
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("d", lineRight);
        } else {
            g2.append("path")
                .datum(countryData)
                .attr("class", "line left-line")
                .attr("fill", "none")
                .attr("stroke", currentDataType === 'covid_deaths' ? "red" : "blue")
                .attr("stroke-width", 2)
                .attr("d", lineLeft);

            g2.append("path")
                .datum(countryData)
                .attr("class", "line right-line")
                .attr("fill", "none")
                .attr("stroke", currentDataType === 'cum_covid_deaths' ? "green" : "orange")
                .attr("stroke-width", 2)
                .attr("d", lineRight);
        }

        g2.selectAll(".x-axis").call(xAxis2);
        g2.selectAll(".y-left").call(yAxisLeft2);
        g2.selectAll(".y-right").call(yAxisRight2);

        g2.select('.y-axis-label-left').text(currentDataType === 'covid_deaths' ? 'New Deaths' : 'New Cases').style('fill', currentDataType === 'covid_deaths' ? 'red' : 'blue');
        g2.select('.y-axis-label-right').text(currentDataType === 'cum_covid_deaths' ? 'Cumulative Deaths' : 'Cumulative Cases').style('fill', currentDataType === 'cum_covid_deaths' ? 'green' : 'orange');
    }

    d3.selectAll('#scene2 .button-group button[data-type]').on('click', function () {
        currentDataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene2 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateLines2();
    });

    d3.select('#scene2 #switch-y-axis').on('click', function () {
        if (yScaleLeft2.range()[0] === height2) {
            yScaleLeft2.range([height2, 0]);
            yScaleRight2.range([height2, 0]);
        } else {
            yScaleLeft2.range([0, height2]);
            yScaleRight2.range([0, height2]);
        }
        updateLines2();
    });

    updateLines2();
});

// Scene 3
d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
    const stateData = d3.rollups(
        data,
        v => ({
            date: new Date(v[0].date),
            covid_cases: d3.sum(v, d => +d.covid_cases),
            covid_deaths: d3.sum(v, d => +d.covid_deaths)
        }),
        d => d.state
    ).map(([key, value]) => ({ state: key, data: value }));

    const svg3 = d3.select("#scene3 #chart").append("svg").attr("width", 800).attr("height", 450);
    const margin3 = { top: 20, right: 200, bottom: 100, left: 60 };
    const width3 = 800 - margin3.left - margin3.right;
    const height3 = 450 - margin3.top - margin3.bottom;
    const xScale3 = d3.scaleBand().range([0, width3]).padding(0.1);
    const yScale3 = d3.scaleLinear().range([height3, 0]);

    const xAxis3 = svg3.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height3})`);
    const yAxis3 = svg3.append("g").attr("class", "y-axis");
    const tooltip3 = d3.select("body").append("div").attr("class", "tooltip");

    function updateChart3(dataType, timeIndex) {
        const color = dataType === 'cases' ? 'blue' : 'red';
        const dataKey = dataType === 'cases' ? 'covid_cases' : 'covid_deaths';
        const selectedData = stateData.map(d => ({
            state: d.state,
            value: d.data[timeIndex] ? d.data[timeIndex][dataKey] : 0
        })).sort((a, b) => b.value - a.value);

        xScale3.domain(selectedData.map(d => d.state));
        yScale3.domain([0, d3.max(selectedData, d => d.value)]).nice();

        xAxis3.transition().duration(1000).call(d3.axisBottom(xScale3).tickSize(0).tickPadding(6))
            .selectAll("text").attr("transform", "rotate(-90) translate(-10, -10)").style("text-anchor", "end");

        yAxis3.transition().duration(1000).call(d3.axisLeft(yScale3).ticks(10));

        const bars = svg3.selectAll(".bar").data(selectedData, d => d.state);
        bars.exit().remove();
        bars.transition().duration(1000)
            .attr("x", d => xScale3(d.state)).attr("y", d => yScale3(d.value))
            .attr("width", xScale3.bandwidth()).attr("height", d => height3 - yScale3(d.value))
            .attr("fill", color);

        bars.enter().append("rect").attr("class", "bar")
            .attr("x", d => xScale3(d.state)).attr("y", d => yScale3(d.value))
            .attr("width", xScale3.bandwidth()).attr("height", d => height3 - yScale3(d.value))
            .attr("fill", color).attr("opacity", 0).transition().duration(1000).attr("opacity", 1);

        bars.on("mouseover", function (event, d) {
            tooltip3.transition().duration(200).style("opacity", .9);
            tooltip3.html(`${d.state}: ${d.value.toLocaleString()}`).style("left", (event.pageX + 5) + "px").style("top", (event.pageY - 28) + "px");
        }).on("mouseout", function () {
            tooltip3.transition().duration(500).style("opacity", 0);
        });

        const top5 = selectedData.slice(0, 5);
        svg3.selectAll(".annotation-group").remove();
        const annotationGroup = svg3.append("g").attr("class", "annotation-group");
        const x0 = xScale3(top5[0].state) - xScale3.bandwidth() / 2;
        const x1 = xScale3(top5[top5.length - 1].state) + xScale3.bandwidth() * 1.5;
        const rectHeight = height3 - yScale3(d3.max(top5, d => d.value)) + 20;

        annotationGroup.append("rect").attr("x", x0).attr("y", yScale3(d3.max(top5, d => d.value)) - 20)
            .attr("width", x1 - x0).attr("height", 0).attr("fill", "none").attr("stroke", "black").attr("stroke-width", 2)
            .transition().duration(2000).attr("height", rectHeight);

        const annotationText = annotationGroup.append("text").attr("x", x1 + 10).attr("y", yScale3(d3.max(top5, d => d.value)) - 20)
            .attr("text-anchor", "start").attr("font-size", "14px").attr("font-weight", "bold").attr("opacity", 0)
            .transition().duration(2000).attr("opacity", 1).text(`Top 5 States in ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`);

        annotationGroup.selectAll(".detail-text").remove();
        top5.forEach((d, i) => {
            annotationGroup.append("text").attr("class", "detail-text")
                .attr("x", x1 + 10).attr("y", yScale3(d3.max(top5, d => d.value)) - 20 + (i + 1) * 20)
                .attr("text-anchor", "start").attr("font-size", "12px").attr("opacity", 0)
                .transition().duration(2000).attr("opacity", 1).text(`${d.state}: ${d.value.toLocaleString()}`);
        });
    }

    d3.selectAll('#scene3 .button-group button').on('click', function () {
        d3.selectAll('#scene3 .button-group button').classed('active', false);
        d3.select(this).classed('active', true);
        const dataType = d3.select(this).attr('data-type');
        updateChart3(dataType, parseInt(d3.select('#time-slider').property('value')));
    });

    d3.select('#time-slider').on('input', function () {
        const dataType = d3.select('#scene3 .button-group button.active').attr('data-type');
        updateChart3(dataType, parseInt(this.value));
    });

    updateChart3('cases', 0);
});

// Scene 4
d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
    // Get unique states
    const states = Array.from(new Set(data.map(d => d.state))).sort();
    
    // Populate state select dropdown
    const stateSelect = d3.select("#scene4 #state-select");
    states.forEach(state => {
        stateSelect.append("option")
            .attr("value", state)
            .text(state);
    });

    // Set up SVG and dimensions
    const margin = { top: 20, right: 100, bottom: 60, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#scene4 #visualization4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let currentDataType = 'cases';
    let currentRegion = 'nation';
    let currentState = '';

    function filterData(data) {
        if (currentRegion === 'state') {
            return data.filter(d => d.state === currentState);
        }
        return data;
    }

    function aggregateData(filteredData) {
        return d3.rollups(
            filteredData,
            v => ({
                date: new Date(v[0].date),
                covid_cases: d3.sum(v, d => +d.covid_cases),
                covid_deaths: d3.sum(v, d => +d.covid_deaths),
                cum_one_vax_dose: d3.sum(v, d => +d.cum_one_vax_dose)
            }),
            d => d.date
        ).map(([key, value]) => value);
    }

    function updateScales(countryData) {
        const xScale = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width]);
        let yScaleLeft = d3.scaleLinear().domain([0, d3.max(countryData, d => d[currentDataType === 'cases' ? 'covid_cases' : 'covid_deaths'])]).range([height, 0]);
        let yScaleRight = d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_one_vax_dose)]).range([height, 0]);

        const yAxisLeft = d3.axisLeft(yScaleLeft).ticks(10);
        const yAxisRight = d3.axisRight(yScaleRight).ticks(10);
        const xAxis = d3.axisBottom(xScale);

        svg.select(".x-axis").remove();
        svg.select(".y-left").remove();
        svg.select(".y-right").remove();

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.append("g")
            .attr("class", "y-axis y-left")
            .call(yAxisLeft);

        svg.append("g")
            .attr("class", "y-axis y-right")
            .attr("transform", `translate(${width},0)`)
            .call(yAxisRight);

        svg.select('.y-axis-label-left').text(currentDataType === 'cases' ? 'New Cases' : 'New Deaths').style('fill', currentDataType === 'cases' ? 'blue' : 'red');
        svg.select('.y-axis-label-right').text('Cumulative Vaccinations').style('fill', 'green');

        return { xScale, yScaleLeft, yScaleRight };
    }

    function updateLines(scales, countryData) {
        const { xScale, yScaleLeft, yScaleRight } = scales;

        const lineLeft = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleLeft(d[currentDataType === 'cases' ? 'covid_cases' : 'covid_deaths']))
            .curve(d3.curveMonotoneX);

        const lineRight = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScaleRight(d.cum_one_vax_dose))
            .curve(d3.curveMonotoneX);

        svg.selectAll(".line").remove(); // Ensure only two lines are present at any time
        svg.selectAll(".annotation").remove(); // Remove previous annotations

        // Filter data to plot only until the first non-zero cumulative vaccination
        const plotData = countryData.filter(d => d.cum_one_vax_dose === 0);
        const remainingData = countryData.filter(d => d.cum_one_vax_dose > 0);

        const leftPath = svg.append("path")
            .datum(plotData)
            .attr("class", "line left-line")
            .attr("fill", "none")
            .attr("stroke", currentDataType === 'cases' ? "blue" : "red")
            .attr("stroke-width", 2)
            .attr("d", lineLeft);

        const rightPath = svg.append("path")
            .datum(plotData)
            .attr("class", "line right-line")
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 2)
            .attr("d", lineRight);

        const firstVaxDate = countryData.find(d => d.cum_one_vax_dose > 0);

        leftPath.transition().duration(4000).attrTween("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return d3.interpolateString("0," + length, length + "," + length);
        });

        rightPath.transition().duration(4000).attrTween("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return d3.interpolateString("0," + length, length + "," + length);
        }).on("end", () => {
            if (firstVaxDate) {
                svg.append("text")
                    .attr("class", "annotation")
                    .attr("x", xScale(firstVaxDate.date))
                    .attr("y", yScaleRight(firstVaxDate.cum_one_vax_dose))
                    .attr("dy", -10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("fill", "green")
                    .text("Vaccinations Started");

                setTimeout(() => {
                    const leftRemainingPath = svg.append("path")
                        .datum(remainingData)
                        .attr("class", "line left-remaining-line")
                        .attr("fill", "none")
                        .attr("stroke", currentDataType === 'cases' ? "blue" : "red")
                        .attr("stroke-width", 2)
                        .attr("d", lineLeft);

                    const rightRemainingPath = svg.append("path")
                        .datum(remainingData)
                        .attr("class", "line right-remaining-line")
                        .attr("fill", "none")
                        .attr("stroke", "green")
                        .attr("stroke-width", 2)
                        .attr("d", lineRight);

                    leftRemainingPath.transition().duration(8000).attrTween("stroke-dasharray", function () {
                        const length = this.getTotalLength();
                        return d3.interpolateString("0," + length, length + "," + length);
                    });

                    rightRemainingPath.transition().duration(8000).attrTween("stroke-dasharray", function () {
                        const length = this.getTotalLength();
                        return d3.interpolateString("0," + length, length + "," + length);
                    });
                }, 2000);
            }
        });
    }

    function updateVisualization() {
        const filteredData = filterData(data);
        const countryData = aggregateData(filteredData);
        const scales = updateScales(countryData);
        updateLines(scales, countryData);
    }

    // Region select change event
    d3.select("#scene4 #region-select").on("change", function () {
        currentRegion = this.value;
        if (currentRegion === 'state') {
            d3.select("#scene4 #state-select").style("display", "inline-block");
        } else {
            d3.select("#scene4 #state-select").style("display", "none");
        }
        updateVisualization();
    });

    // State select change event
    d3.select("#scene4 #state-select").on("change", function () {
        currentState = this.value;
        updateVisualization();
    });

    // Button actions
    d3.selectAll('#scene4 .button-group button[data-type]').on('click', function () {
        currentDataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene4 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateVisualization();
    });

    // Initial setup
    svg.append('text')
        .attr('class', 'y-axis-label-left')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 30)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    svg.append('text')
        .attr('class', 'y-axis-label-right')
        .attr('transform', 'rotate(-90)')
        .attr('y', width + margin.right - 20)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Time');

    // Initial visualization setup
    updateVisualization();
});
