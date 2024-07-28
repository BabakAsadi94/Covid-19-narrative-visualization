let currentScene = 0;
const scenes = document.querySelectorAll('.scene');
const intro = document.getElementById('intro');

function navigate(offset) {
    scenes[currentScene].style.display = 'none';
    currentScene += offset;
    if (currentScene < 0) currentScene = scenes.length - 1;
    if (currentScene >= scenes.length) currentScene = 0;
    scenes[currentScene].style.display = 'block';
}

function navigateTo(sceneIndex) {
    intro.style.display = 'none';
    scenes[currentScene].style.display = 'none';
    currentScene = sceneIndex;
    scenes[currentScene].style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    intro.style.display = 'block';
    scenes.forEach(scene => scene.style.display = 'none');
    scenes[currentScene].style.display = 'block';
});

d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
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

    const stateDataByDate = d3.rollups(
        data,
        v => ({
            covid_cases: d3.sum(v, d => +d.covid_cases),
            covid_deaths: d3.sum(v, d => +d.covid_deaths),
            one_vax_dose: d3.sum(v, d => +d.one_vax_dose)
        }),
        d => d.state,
        d => d.date
    );

    const stateData = stateDataByDate.map(([state, values]) => ({
        state,
        data: values.map(([date, value]) => ({
            date: new Date(date),
            covid_cases: value.covid_cases,
            covid_deaths: value.covid_deaths,
            one_vax_dose: value.one_vax_dose
        }))
    }));

    // Scene 1: New Cases and Cumulative Cases Visualization
    const svg1 = d3.select("#scene1 #visualization1").append("svg").attr("width", 1000).attr("height", 500);
    const margin1 = { top: 20, right: 100, bottom: 60, left: 100 };
    const width1 = 1000 - margin1.left - margin1.right;
    const height1 = 500 - margin1.top - margin1.bottom;

    let isLogScale1 = false;
    const xScale1 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width1]);
    let yScaleLeft1 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_cases)]).range([height1, 0]);
    let yScaleRight1 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_cases)]).range([height1, 0]);
    const yScaleLeftLog1 = d3.scaleLog().domain([1, d3.max(countryData, d => d.covid_cases)]).range([height1, 0]);
    const yScaleRightLog1 = d3.scaleLog().domain([1, d3.max(countryData, d => d.cum_covid_cases)]).range([height1, 0]);

    let yAxisLeft1 = d3.axisLeft(yScaleLeft1).ticks(10);
    let yAxisRight1 = d3.axisRight(yScaleRight1).ticks(10);
    const xAxis1 = d3.axisBottom(xScale1);

    svg1.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height1})`).call(xAxis1);
    svg1.append("g").attr("class", "y-axis y-left").call(yAxisLeft1);
    svg1.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width1},0)`).call(yAxisRight1);

    svg1.append('text')
        .attr('class', 'y-axis-label-left')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin1.left + 30)
        .attr('x', -height1 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', 'blue')
        .text('New Cases');

    svg1.append('text')
        .attr('class', 'y-axis-label-right')
        .attr('transform', 'rotate(-90)')
        .attr('y', width1 + margin1.right - 20)
        .attr('x', -height1 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', 'steelblue')
        .text('Cumulative Cases');

    svg1.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width1 / 2)
        .attr('y', height1 + margin1.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Time');

    let lineNewCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleLeft1(d.covid_cases)).curve(d3.curveMonotoneX);
    let lineCumCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleRight1(d.cum_covid_cases)).curve(d3.curveMonotoneX);

    const pathNewCases1 = svg1.append("path").datum(countryData).attr("class", "line new-cases")
        .attr("fill", "none").attr("stroke", "blue").attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2).attr("d", lineNewCases1).attr("opacity", 0);

    const pathCumCases1 = svg1.append("path").datum(countryData).attr("class", "line cum-cases")
        .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2)
        .attr("d", lineCumCases1).attr("opacity", 0);

    function toggleScale1() {
        isLogScale1 = !isLogScale1;
        yScaleLeft1 = isLogScale1 ? yScaleLeftLog1 : d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_cases)]).range([height1, 0]);
        yScaleRight1 = isLogScale1 ? yScaleRightLog1 : d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_cases)]).range([height1, 0]);

        yAxisLeft1 = d3.axisLeft(yScaleLeft1).ticks(10, isLogScale1 ? ".1s" : "");
        yAxisRight1 = d3.axisRight(yScaleRight1).ticks(10, isLogScale1 ? ".1s" : "");

        svg1.select(".y-left").transition().duration(500).call(yAxisLeft1);
        svg1.select(".y-right").transition().duration(500).call(yAxisRight1);

        lineNewCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleLeft1(d.covid_cases)).curve(d3.curveMonotoneX);
        lineCumCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleRight1(d.cum_covid_cases)).curve(d3.curveMonotoneX);

        pathNewCases1.transition().duration(500).attr("d", lineNewCases1);
        pathCumCases1.transition().duration(500).attr("d", lineCumCases1);

        updateHover1();
    }

    d3.select("#scene1 #switch-y-axis").on("click", toggleScale1);

    const tooltip1 = d3.select('body').append('div').attr('class', 'tooltip');

    function addHover1(path, yScale, dataKey, color) {
        const focus = svg1.append('g').attr('class', 'focus').style('display', 'none');
        focus.append('circle').attr('r', 4.5).attr('fill', color);
        focus.append('rect').attr('class', 'tooltip-background').attr('width', 150).attr('height', 50).attr('x', 10).attr('y', -22)
            .attr('rx', 4).attr('ry', 4).attr('fill', 'lightsteelblue').style('opacity', 0.9);
        focus.append('text').attr('class', 'tooltip-text').attr('x', 18).attr('y', -2).attr('dy', '.35em');

        svg1.selectAll('.dot' + dataKey).data(countryData).enter().append('circle').attr('class', 'dot' + dataKey)
            .attr('cx', d => xScale1(d.date)).attr('cy', d => yScale(d[dataKey])).attr('r', 4).attr('fill', color).attr('opacity', 0)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 1);
                tooltip1.transition().duration(200).style('opacity', .9);
                tooltip1.html(`Date: ${d3.timeFormat("%b %d, %Y")(d.date)}<br>${dataKey.replace('_', ' ')}: ${d[dataKey]}`)
                    .style('left', (event.pageX + 5) + 'px').style('top', (event.pageY - 28) + 'px');
            }).on('mouseout', function () {
                d3.select(this).attr('opacity', 0);
                tooltip1.transition().duration(500).style('opacity', 0);
            });
    }

    function updateHover1() {
        d3.selectAll('.dotcovid_cases').remove();
        d3.selectAll('.dotcum_covid_cases').remove();
        addHover1(pathNewCases1, yScaleLeft1, 'covid_cases', 'blue');
        addHover1(pathCumCases1, yScaleRight1, 'cum_covid_cases', 'steelblue');
    }

    function updateVisualization1(dataType) {
        d3.selectAll('#scene1 .button-group button').attr('disabled', true);
        pathNewCases1.attr("opacity", 0);
        pathCumCases1.attr("opacity", 0);

        if (dataType === 'covid_cases') {
            pathNewCases1.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene1 .button-group button').attr('disabled', null));
        } else if (dataType === 'cum_covid_cases') {
            pathCumCases1.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene1 .button-group button').attr('disabled', null));
        } else {
            pathNewCases1.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            });
            pathCumCases1.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene1 .button-group button').attr('disabled', null));
        }

        updateHover1();
    }

    updateVisualization1('both');
    d3.selectAll('#scene1 .button-group button[data-type]').on('click', function () {
        const dataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene1 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateVisualization1(dataType);
    });

    // Scene 2: New Deaths and Cumulative Deaths Visualization
    const svg2 = d3.select("#scene2 #visualization2").append("svg").attr("width", 1000).attr("height", 500);
    const margin2 = { top: 20, right: 60, bottom: 60, left: 100 };
    const width2 = 1000 - margin2.left - margin2.right;
    const height2 = 500 - margin2.top - margin2.bottom;

    let isLogScale2 = false;
    const xScale2 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width2]);
    let yScaleLeft2 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_deaths)]).range([height2, 0]);
    let yScaleRight2 = d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_deaths)]).range([height2, 0]);
    const yScaleLeftLog2 = d3.scaleLog().domain([1, d3.max(countryData, d => d.covid_deaths)]).range([height2, 0]);
    const yScaleRightLog2 = d3.scaleLog().domain([1, d3.max(countryData, d => d.cum_covid_deaths)]).range([height2, 0]);

    let yAxisLeft2 = d3.axisLeft(yScaleLeft2).ticks(10);
    let yAxisRight2 = d3.axisRight(yScaleRight2).ticks(10);
    const xAxis2 = d3.axisBottom(xScale2);

    svg2.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height2})`).call(xAxis2);
    svg2.append("g").attr("class", "y-axis y-left").call(yAxisLeft2);
    svg2.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width2},0)`).call(yAxisRight2);

    svg2.append('text')
        .attr('class', 'y-axis-label-left')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin2.left + 50)
        .attr('x', -height2 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', 'red')
        .text('New Deaths');

    svg2.append('text')
        .attr('class', 'y-axis-label-right')
        .attr('transform', 'rotate(-90)')
        .attr('y', width2 + margin2.right + 0)
        .attr('x', -height2 / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', 'darkred')
        .text('Cumulative Deaths');

    svg2.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width2 / 2)
        .attr('y', height2 + margin2.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Time');

    let lineNewDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleLeft2(d.covid_deaths)).curve(d3.curveMonotoneX);
    let lineCumDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleRight2(d.cum_covid_deaths)).curve(d3.curveMonotoneX);

    const pathNewDeaths2 = svg2.append("path").datum(countryData).attr("class", "line new-deaths")
        .attr("fill", "none").attr("stroke", "red").attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2).attr("d", lineNewDeaths2).attr("opacity", 0);

    const pathCumDeaths2 = svg2.append("path").datum(countryData).attr("class", "line cum-deaths")
        .attr("fill", "none").attr("stroke", "darkred").attr("stroke-width", 2)
        .attr("d", lineCumDeaths2).attr("opacity", 0);

    function toggleScale2() {
        isLogScale2 = !isLogScale2;
        yScaleLeft2 = isLogScale2 ? yScaleLeftLog2 : d3.scaleLinear().domain([0, d3.max(countryData, d => d.covid_deaths)]).range([height2, 0]);
        yScaleRight2 = isLogScale2 ? yScaleRightLog2 : d3.scaleLinear().domain([0, d3.max(countryData, d => d.cum_covid_deaths)]).range([height2, 0]);

        yAxisLeft2 = d3.axisLeft(yScaleLeft2).ticks(10, isLogScale2 ? ".1s" : "");
        yAxisRight2 = d3.axisRight(yScaleRight2).ticks(10, isLogScale2 ? ".1s" : "");

        svg2.select(".y-left").transition().duration(500).call(yAxisLeft2);
        svg2.select(".y-right").transition().duration(500).call(yAxisRight2);

        lineNewDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleLeft2(d.covid_deaths)).curve(d3.curveMonotoneX);
        lineCumDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleRight2(d.cum_covid_deaths)).curve(d3.curveMonotoneX);

        pathNewDeaths2.transition().duration(500).attr("d", lineNewDeaths2);
        pathCumDeaths2.transition().duration(500).attr("d", lineCumDeaths2);

        updateHover2();
    }

    d3.select("#scene2 #switch-y-axis").on("click", toggleScale2);

    const tooltip2 = d3.select('body').append('div').attr('class', 'tooltip');

    function addHover2(path, yScale, dataKey, color) {
        const focus = svg2.append('g').attr('class', 'focus').style('display', 'none');
        focus.append('circle').attr('r', 4.5).attr('fill', color);
        focus.append('rect').attr('class', 'tooltip-background').attr('width', 150).attr('height', 50).attr('x', 10).attr('y', -22)
            .attr('rx', 4).attr('ry', 4).attr('fill', 'lightsteelblue').style('opacity', 0.9);
        focus.append('text').attr('class', 'tooltip-text').attr('x', 18).attr('y', -2).attr('dy', '.35em');

        svg2.selectAll('.dot' + dataKey).data(countryData).enter().append('circle').attr('class', 'dot' + dataKey)
            .attr('cx', d => xScale2(d.date)).attr('cy', d => yScale(d[dataKey])).attr('r', 4).attr('fill', color).attr('opacity', 0)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 1);
                tooltip2.transition().duration(200).style('opacity', .9);
                tooltip2.html(`Date: ${d3.timeFormat("%b %d, %Y")(d.date)}<br>${dataKey.replace('_', ' ')}: ${d[dataKey]}`)
                    .style('left', (event.pageX + 5) + 'px').style('top', (event.pageY - 28) + 'px');
            }).on('mouseout', function () {
                d3.select(this).attr('opacity', 0);
                tooltip2.transition().duration(500).style('opacity', 0);
            });
    }

    function updateHover2() {
        d3.selectAll('.dotcovid_deaths').remove();
        d3.selectAll('.dotcum_covid_deaths').remove();
        addHover2(pathNewDeaths2, yScaleLeft2, 'covid_deaths', 'red');
        addHover2(pathCumDeaths2, yScaleRight2, 'cum_covid_deaths', 'darkred');
    }

    function updateVisualization2(dataType) {
        d3.selectAll('#scene2 .button-group button').attr('disabled', true);
        pathNewDeaths2.attr("opacity", 0);
        pathCumDeaths2.attr("opacity", 0);

        if (dataType === 'covid_deaths') {
            pathNewDeaths2.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene2 .button-group button').attr('disabled', null));
        } else if (dataType === 'cum_covid_deaths') {
            pathCumDeaths2.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene2 .button-group button').attr('disabled', null));
        } else {
            pathNewDeaths2.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            });
            pathCumDeaths2.transition().duration(5000).attr("opacity", 1).attrTween("stroke-dasharray", function() {
                const length = this.getTotalLength();
                return d3.interpolateString("0," + length, length + "," + length);
            }).on('end', () => d3.selectAll('#scene2 .button-group button').attr('disabled', null));
        }

        updateHover2();
    }

    updateVisualization2('both');
    d3.selectAll('#scene2 .button-group button[data-type]').on('click', function () {
        const dataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene2 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateVisualization2(dataType);
    });

    // Scene 3: State-wise Cases and Deaths
    const svg3 = d3.select("#scene3 #chart").append("svg").attr("width", 1080).attr("height", 540);
    const margin3 = { top: 20, right: 200, bottom: 100, left: 60 };
    const width3 = 1080 - margin3.left - margin3.right;
    const height3 = 540 - margin3.top - margin3.bottom;
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
            .attr("text-anchor", "start").attr("font-size", "14px").attr("font-weight", "bold").attr("fill", "black")
            .text("Top 5 States").attr("opacity", 0);

        annotationText.transition().duration(2000).attr("opacity", 1);
    }

    updateChart3("cases", 0);
    d3.select("#time-slider").on("input", function () {
        const timeIndex = +this.value;
        updateChart3(d3.select(".cases").classed("active") ? "cases" : "deaths", timeIndex);
    });

    d3.selectAll("#scene3 .button-group button").on("click", function () {
        d3.selectAll("#scene3 .button-group button").classed("active", false);
        d3.select(this).classed("active", true);
        updateChart3(d3.select(this).attr("data-type"), +d3.select("#time-slider").property("value"));
    });

    // Scene 4: State-wise Cumulative Cases and Deaths
    const select = d3.select("#state-select");
    const states = stateData.map(d => d.state).sort();
    select.selectAll("option").data(states).enter().append("option").text(d => d);

    const svgCases = d3.select("#chart-cases").append("svg").attr("width", 1000).attr("height", 500);
    const svgDeaths = d3.select("#chart-deaths").append("svg").attr("width", 1000).attr("height", 500);

    function updateStateCharts(selectedState) {
        const stateData = stateDataByDate.get(selectedState) || [];

        const dates = stateData.map(d => d[0]);
        const covidCases = stateData.map(d => d[1].covid_cases);
        const covidDeaths = stateData.map(d => d[1].covid_deaths);

        const xScaleCases = d3.scaleTime().domain(d3.extent(dates)).range([0, 900]);
        const yScaleCases = d3.scaleLinear().domain([0, d3.max(covidCases)]).range([400, 0]);
        const xAxisCases = d3.axisBottom(xScaleCases).ticks(10);
        const yAxisCases = d3.axisLeft(yScaleCases).ticks(10);

        const xScaleDeaths = d3.scaleTime().domain(d3.extent(dates)).range([0, 900]);
        const yScaleDeaths = d3.scaleLinear().domain([0, d3.max(covidDeaths)]).range([400, 0]);
        const xAxisDeaths = d3.axisBottom(xScaleDeaths).ticks(10);
        const yAxisDeaths = d3.axisLeft(yScaleDeaths).ticks(10);

        svgCases.selectAll("*").remove();
        svgDeaths.selectAll("*").remove();

        svgCases.append("g").attr("class", "x-axis").attr("transform", "translate(50,450)").call(xAxisCases);
        svgCases.append("g").attr("class", "y-axis").attr("transform", "translate(50,50)").call(yAxisCases);
        svgDeaths.append("g").attr("class", "x-axis").attr("transform", "translate(50,450)").call(xAxisDeaths);
        svgDeaths.append("g").attr("class", "y-axis").attr("transform", "translate(50,50)").call(yAxisDeaths);

        const lineCases = d3.line().x(d => xScaleCases(d[0])).y(d => yScaleCases(d[1].covid_cases)).curve(d3.curveMonotoneX);
        const lineDeaths = d3.line().x(d => xScaleDeaths(d[0])).y(d => yScaleDeaths(d[1].covid_deaths)).curve(d3.curveMonotoneX);

        svgCases.append("path").datum(stateData).attr("class", "line").attr("d", lineCases)
            .attr("fill", "none").attr("stroke", "blue").attr("stroke-width", 2)
            .attr("transform", "translate(50,50)");

        svgDeaths.append("path").datum(stateData).attr("class", "line").attr("d", lineDeaths)
            .attr("fill", "none").attr("stroke", "red").attr("stroke-width", 2)
            .attr("transform", "translate(50,50)");
    }

    select.on("change", function () {
        updateStateCharts(this.value);
    });

    updateStateCharts(states[0]);
});
