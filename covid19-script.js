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

    // Initialize each scene
    initScene1();
    initScene2();
    initScene3();
    initScene4();
});

function initScene1() {
    d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
        const countryData = d3.rollups(
            data,
            v => ({
                date: new Date(v[0].date),
                covid_cases: d3.sum(v, d => +d.covid_cases),
                cum_covid_cases: d3.sum(v, d => +d.cum_covid_cases)
            }),
            d => d.date
        ).map(([key, value]) => value);

        const svg1 = d3.select("#scene1 #visualization1").append("svg").attr("width", 1200).attr("height", 600);
        const margin1 = { top: 20, right: 100, bottom: 60, left: 100 };
        const width1 = 1200 - margin1.left - margin1.right;
        const height1 = 600 - margin1.top - margin1.bottom;

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

        d3.selectAll('#scene1 .button-group button[data-type]').on('click', function () {
            const dataType = d3.select(this).attr('data-type');
            d3.selectAll('#scene1 .button-group button[data-type]').classed('active', false);
            d3.select(this).classed('active', true);
            updateVisualization1(dataType);
        });
    });
}

function initScene2() {
    d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
        const countryData = d3.rollups(
            data,
            v => ({
                date: new Date(v[0].date),
                covid_deaths: d3.sum(v, d => +d.covid_deaths),
                cum_covid_deaths: d3.sum(v, d => +d.cum_covid_deaths)
            }),
            d => d.date
        ).map(([key, value]) => value);

        const svg2 = d3.select("#scene2 #visualization2").append("svg").attr("width", 1200).attr("height", 600);
        const margin2 = { top: 20, right: 100, bottom: 60, left: 100 };
        const width2 = 1200 - margin2.left - margin2.right;
        const height2 = 600 - margin2.top - margin2.bottom;

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
            .attr('y', -margin2.left + 30)
            .attr('x', -height2 / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', 'red')
            .text('New Deaths');

        svg2.append('text')
            .attr('class', 'y-axis-label-right')
            .attr('transform', 'rotate(-90)')
            .attr('y', width2 + margin2.right - 20)
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

        d3.select("#scene2 #switch-y-axis-deaths").on("click", toggleScale2);

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

        d3.selectAll('#scene2 .button-group button[data-type]').on('click', function () {
            const dataType = d3.select(this).attr('data-type');
            d3.selectAll('#scene2 .button-group button[data-type]').classed('active', false);
            d3.select(this).classed('active', true);
            updateVisualization2(dataType);
        });
    });
}

function initScene3() {
    d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
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

        const svg3 = d3.select("#scene3 #chart").append("svg").attr("width", 1200).attr("height", 600);
        const margin3 = { top: 20, right: 200, bottom: 100, left: 60 };
        const width3 = 1200 - margin3.left - margin3.right;
        const height3 = 600 - margin3.top - margin3.bottom;
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

            const annotationText = annotationGroup.append("text").attr("x", x1 + 10).attr("y", yScale3(d3.max(top5, d => d.value)) + 20)
                .attr("text-anchor", "start").attr("font-size", "14px").attr("font-weight", "bold").attr("opacity", 0)
                .transition().duration(2000).attr("opacity", 1).text(`Top 5 States in ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`);

            annotationGroup.selectAll(".detail-text").remove();
            top5.forEach((d, i) => {
                annotationGroup.append("text").attr("class", "detail-text")
                    .attr("x", x1 + 10).attr("y", yScale3(d3.max(top5, d => d.value)) + 20 + (i + 1) * 20)
                    .attr("text-anchor", "start").attr("font-size", "12px").attr("opacity", 0)
                    .transition().duration(2000).attr("opacity", 1).text(`${d.state}: ${d.value.toLocaleString()}`);
            });
        }

        updateChart3('cases', 0);
        d3.selectAll('#scene3 .button-group button').on('click', function () {
            const dataType = d3.select(this).attr('data-type');
            d3.selectAll('#scene3 .button-group button').classed('active', false);
            d3.select(this).classed('active', true);
            const timeIndex = d3.select("#time-slider").property("value");
            updateChart3(dataType, timeIndex);
            updateSliderLabel3(timeIndex);
        });

        d3.select("#scene3 #time-slider").on("input", function () {
            const timeIndex = +this.value;
            const dataType = d3.select("#scene3 .button-group button.active").attr("data-type");
            updateChart3(dataType, timeIndex);
            updateSliderLabel3(timeIndex);
        });

        function updateSliderLabel3(timeIndex) {
            const date = stateData[0].data[timeIndex].date;
            d3.select("#scene3 #slider-label").text(`Date: ${d3.timeFormat("%B %d, %Y")(date)}`);
        }

        const timeSlider3 = d3.select("#scene3 #time-slider");
        timeSlider3.attr("max", stateData[0].data.length - 1);

        const sliderLabels3 = d3.select("#scene3 .slider-labels");
        sliderLabels3.selectAll("span")
            .data([stateData[0].data[0].date, stateData[0].data[Math.floor(stateData[0].data.length / 2)].date, stateData[0].data[stateData[0].data.length - 1].date])
            .enter().append("span").text(d => d3.timeFormat("%B %d, %Y")(d));

        updateSliderLabel3(0);
    });
}

function initScene4() {
    d3.csv('https://raw.githubusercontent.com/CharlieTruong/cs-416-narrative-viz/main/data/covid_weekly_data.csv').then(data => {
        // Get unique states
        const states = Array.from(new Set(data.map(d => d.state))).sort();
        
        // Populate state select dropdown
        const stateSelect = d3.select("#state-select");
        states.forEach(state => {
            stateSelect.append("option")
                .attr("value", state)
                .text(state);
        });

        // Set up SVG and dimensions
        const margin = { top: 20, right: 100, bottom: 60, left: 100 };
        const width = 1200 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        const svg = d3.select("#scene4 #visualization")
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

        function initializeAxes() {
            // Create empty scales for axes
            const xScale = d3.scaleTime().range([0, width]);
            const yScaleLeft = d3.scaleLinear().range([height, 0]);
            const yScaleRight = d3.scaleLinear().range([height, 0]);

            const yAxisLeft = d3.axisLeft(yScaleLeft).ticks(10);
            const yAxisRight = d3.axisRight(yScaleRight).ticks(10);
            const xAxis = d3.axisBottom(xScale);

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

            svg.select('.y-axis-label-left').text('New Cases').style('fill', 'blue');
            svg.select('.y-axis-label-right').text('Cumulative Vaccinations').style('fill', 'green');
        }

        // Initialize axes on load
        initializeAxes();

        // Region select change event
        d3.select("#region-select").on("change", function () {
            currentRegion = this.value;
            if (currentRegion === 'state') {
                d3.select("#state-select").style("display", "inline-block");
            } else {
                d3.select("#state-select").style("display", "none");
            }
            updateVisualization();
        });

        // State select change event
        d3.select("#state-select").on("change", function () {
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
    });
}
