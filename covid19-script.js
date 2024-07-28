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
    const svg1 = d3.select("#scene1 #visualization1").append("svg").attr("width", 800).attr("height", 500)
        .attr("viewBox", "0 0 800 500").attr("preserveAspectRatio", "xMidYMid meet");
    const margin1 = { top: 20, right: 100, bottom: 60, left: 100 };
    const width1 = 800 - margin1.left - margin1.right;
    const height1 = 500 - margin1.top - margin1.bottom;

    let isLogScale1 = false;
    const xScale1 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width1]);
    let yScaleLeft1 = d3.scaleLinear().range([height1, 0]);
    let yScaleRight1 = d3.scaleLinear().range([height1, 0]);
    const yScaleLeftLog1 = d3.scaleLog().range([height1, 0]);
    const yScaleRightLog1 = d3.scaleLog().range([height1, 0]);

    const yAxisLeft1 = svg1.append("g").attr("class", "y-axis y-left").attr("transform", `translate(${margin1.left},0)`);
    const yAxisRight1 = svg1.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width1 + margin1.left},0)`);
    const xAxis1 = svg1.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height1})`);

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

    function updateScales1(dataType) {
        const yDomainLeft = dataType === 'cum_covid_cases' || dataType === 'both' ?
            [1, d3.max(countryData, d => d.cum_covid_cases)] :
            [1, d3.max(countryData, d => d.covid_cases)];

        const yDomainRight = [1, d3.max(countryData, d => d.cum_covid_cases)];

        yScaleLeft1.domain(yDomainLeft);
        yScaleRight1.domain(yDomainRight);
        yScaleLeftLog1.domain(yDomainLeft);
        yScaleRightLog1.domain(yDomainRight);
    }

    function toggleScale1() {
        isLogScale1 = !isLogScale1;
        updateScales1('both');
        yAxisLeft1.transition().duration(500).call(d3.axisLeft(isLogScale1 ? yScaleLeftLog1 : yScaleLeft1).ticks(10));
        yAxisRight1.transition().duration(500).call(d3.axisRight(isLogScale1 ? yScaleRightLog1 : yScaleRight1).ticks(10));
        updateVisualization1(d3.select('#scene1 .button-group .active').attr('data-type'));
    }

    d3.select("#scene1 #switch-y-axis").on("click", toggleScale1);

    function updateVisualization1(dataType) {
        updateScales1(dataType);

        const lineNewCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleLeft1(d.covid_cases)).curve(d3.curveMonotoneX);
        const lineCumCases1 = d3.line().x(d => xScale1(d.date)).y(d => yScaleRight1(d.cum_covid_cases)).curve(d3.curveMonotoneX);

        yAxisLeft1.call(d3.axisLeft(isLogScale1 ? yScaleLeftLog1 : yScaleLeft1).ticks(10));
        yAxisRight1.call(d3.axisRight(isLogScale1 ? yScaleRightLog1 : yScaleRight1).ticks(10));
        xAxis1.call(d3.axisBottom(xScale1));

        svg1.selectAll(".line.new-cases").data([countryData])
            .join("path").attr("class", "line new-cases")
            .attr("fill", "none").attr("stroke", "blue").attr("stroke-dasharray", "5,5")
            .attr("stroke-width", 2).attr("d", lineNewCases1).attr("opacity", dataType === 'covid_cases' || dataType === 'both' ? 1 : 0);

        svg1.selectAll(".line.cum-cases").data([countryData])
            .join("path").attr("class", "line cum-cases")
            .attr("fill", "none").attr("stroke", "steelblue")
            .attr("stroke-width", 2).attr("d", lineCumCases1).attr("opacity", dataType === 'cum_covid_cases' || dataType === 'both' ? 1 : 0);
    }

    d3.selectAll('#scene1 .button-group button[data-type]').on('click', function () {
        const dataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene1 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateVisualization1(dataType);
    });

    // Scene 2: New Deaths and Cumulative Deaths Visualization
    const svg2 = d3.select("#scene2 #visualization2").append("svg").attr("width", 800).attr("height", 500)
        .attr("viewBox", "0 0 800 500").attr("preserveAspectRatio", "xMidYMid meet");
    const margin2 = { top: 20, right: 100, bottom: 60, left: 100 };
    const width2 = 800 - margin2.left - margin2.right;
    const height2 = 500 - margin2.top - margin2.bottom;

    let isLogScale2 = false;
    const xScale2 = d3.scaleTime().domain(d3.extent(countryData, d => d.date)).range([0, width2]);
    let yScaleLeft2 = d3.scaleLinear().range([height2, 0]);
    let yScaleRight2 = d3.scaleLinear().range([height2, 0]);
    const yScaleLeftLog2 = d3.scaleLog().range([height2, 0]);
    const yScaleRightLog2 = d3.scaleLog().range([height2, 0]);

    const yAxisLeft2 = svg2.append("g").attr("class", "y-axis y-left").attr("transform", `translate(${margin2.left},0)`);
    const yAxisRight2 = svg2.append("g").attr("class", "y-axis y-right").attr("transform", `translate(${width2 + margin2.left},0)`);
    const xAxis2 = svg2.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height2})`);

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

    function updateScales2(dataType) {
        const yDomainLeft = dataType === 'cum_covid_deaths' || dataType === 'both' ?
            [1, d3.max(countryData, d => d.cum_covid_deaths)] :
            [1, d3.max(countryData, d => d.covid_deaths)];

        const yDomainRight = [1, d3.max(countryData, d => d.cum_covid_deaths)];

        yScaleLeft2.domain(yDomainLeft);
        yScaleRight2.domain(yDomainRight);
        yScaleLeftLog2.domain(yDomainLeft);
        yScaleRightLog2.domain(yDomainRight);
    }

    function toggleScale2() {
        isLogScale2 = !isLogScale2;
        updateScales2('both');
        yAxisLeft2.transition().duration(500).call(d3.axisLeft(isLogScale2 ? yScaleLeftLog2 : yScaleLeft2).ticks(10));
        yAxisRight2.transition().duration(500).call(d3.axisRight(isLogScale2 ? yScaleRightLog2 : yScaleRight2).ticks(10));
        updateVisualization2(d3.select('#scene2 .button-group .active').attr('data-type'));
    }

    d3.select("#scene2 #switch-y-axis").on("click", toggleScale2);

    function updateVisualization2(dataType) {
        updateScales2(dataType);

        const lineNewDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleLeft2(d.covid_deaths)).curve(d3.curveMonotoneX);
        const lineCumDeaths2 = d3.line().x(d => xScale2(d.date)).y(d => yScaleRight2(d.cum_covid_deaths)).curve(d3.curveMonotoneX);

        yAxisLeft2.call(d3.axisLeft(isLogScale2 ? yScaleLeftLog2 : yScaleLeft2).ticks(10));
        yAxisRight2.call(d3.axisRight(isLogScale2 ? yScaleRightLog2 : yScaleRight2).ticks(10));
        xAxis2.call(d3.axisBottom(xScale2));

        svg2.selectAll(".line.new-deaths").data([countryData])
            .join("path").attr("class", "line new-deaths")
            .attr("fill", "none").attr("stroke", "red").attr("stroke-dasharray", "5,5")
            .attr("stroke-width", 2).attr("d", lineNewDeaths2).attr("opacity", dataType === 'covid_deaths' || dataType === 'both' ? 1 : 0);

        svg2.selectAll(".line.cum-deaths").data([countryData])
            .join("path").attr("class", "line cum-deaths")
            .attr("fill", "none").attr("stroke", "darkred")
            .attr("stroke-width", 2).attr("d", lineCumDeaths2).attr("opacity", dataType === 'cum_covid_deaths' || dataType === 'both' ? 1 : 0);
    }

    d3.selectAll('#scene2 .button-group button[data-type]').on('click', function () {
        const dataType = d3.select(this).attr('data-type');
        d3.selectAll('#scene2 .button-group button[data-type]').classed('active', false);
        d3.select(this).classed('active', true);
        updateVisualization2(dataType);
    });

    // Scene 3: State-wise Cases and Deaths
    const svg3 = d3.select("#scene3 #chart").append("svg").attr("width", 1080).attr("height", 700)
        .attr("viewBox", "0 0 1080 700").attr("preserveAspectRatio", "xMidYMid meet");
    const margin3 = { top: 20, right: 200, bottom: 100, left: 60 };
    const width3 = 1080 - margin3.left - margin3.right;
    const height3 = 700 - margin3.top - margin3.bottom;
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

    // Scene 4: State-wise New Cases and New Deaths Visualization
    const stateSelect4 = d3.select("#scene4 #state-select");
    stateData.forEach(d => {
        stateSelect4.append("option").attr("value", d.state).text(d.state);
    });

    const svgCases4 = d3.select("#scene4 #chart-cases").append("svg").attr("width", 800).attr("height", 400)
        .attr("viewBox", "0 0 800 400").attr("preserveAspectRatio", "xMidYMid meet");
    const svgDeaths4 = d3.select("#scene4 #chart-deaths").append("svg").attr("width", 800).attr("height", 400)
        .attr("viewBox", "0 0 800 400").attr("preserveAspectRatio", "xMidYMid meet");

    const margin4 = { top: 20, right: 30, bottom: 50, left: 60 };
    const width4 = 800 - margin4.left - margin4.right;
    const height4 = 400 - margin4.top - margin4.bottom;

    const xScale4 = d3.scaleTime().range([0, width4]);
    const yScaleCases4 = d3.scaleLinear().range([height4, 0]);
    const yScaleDeaths4 = d3.scaleLinear().range([height4, 0]);

    const xAxis4 = d3.axisBottom(xScale4);
    const yAxisCases4 = d3.axisLeft(yScaleCases4).ticks(6);
    const yAxisDeaths4 = d3.axisLeft(yScaleDeaths4).ticks(6);

    svgCases4.append("g").attr("transform", `translate(0,${height4})`).attr("class", "x-axis");
    svgCases4.append("g").attr("class", "y-axis");

    svgDeaths4.append("g").attr("transform", `translate(0,${height4})`).attr("class", "x-axis");
    svgDeaths4.append("g").attr("class", "y-axis");

    svgCases4.append('text').attr('class', 'y-axis-label').attr('transform', 'rotate(-90)')
        .attr('y', -margin4.left + 15).attr('x', -height4 / 2).attr('text-anchor', 'middle')
        .style('font-size', '16px').style('font-weight', 'bold').text('New Cases');

    svgDeaths4.append('text').attr('class', 'y-axis-label').attr('transform', 'rotate(-90)')
        .attr('y', -margin4.left + 20).attr('x', -height4 / 2).attr('text-anchor', 'middle')
        .style('font-size', '16px').style('font-weight', 'bold').text('New Deaths');

    function updateChart4(selectedState) {
        const stateDataFiltered = stateData.find(d => d.state === selectedState);
        if (!stateDataFiltered) return;

        const data = stateDataFiltered.data;
        const peakCases = d3.max(data, d => d.covid_cases);
        const peakDateCases = data.find(d => d.covid_cases === peakCases).date;

        const peakDeaths = d3.max(data, d => d.covid_deaths);
        const peakDateDeaths = data.find(d => d.covid_deaths === peakDeaths).date;

        const firstVaxDate = data.find(d => d.one_vax_dose > 0);

        xScale4.domain(d3.extent(data, d => d.date));
        yScaleCases4.domain([0, peakCases]).nice();
        yScaleDeaths4.domain([0, peakDeaths]).nice();

        d3.selectAll("#scene4 .x-axis").transition().duration(1000).call(xAxis4);
        svgCases4.select(".y-axis").transition().duration(1000).call(yAxisCases4);
        svgDeaths4.select(".y-axis").transition().duration(1000).call(yAxisDeaths4);

        const lineCases4 = d3.line().x(d => xScale4(d.date)).y(d => yScaleCases4(d.covid_cases));
        const lineDeaths4 = d3.line().x(d => xScale4(d.date)).y(d => yScaleDeaths4(d.covid_deaths));

        svgCases4.selectAll(".line").remove();
        svgCases4.append("path").datum(data).attr("class", "line").attr("fill", "none")
            .attr("stroke", "blue").attr("stroke-width", 2).attr("d", lineCases4)
            .attr("opacity", 0).transition().duration(1000).attr("opacity", 1);

        svgDeaths4.selectAll(".line").remove();
        svgDeaths4.append("path").datum(data).attr("class", "line").attr("fill", "none")
            .attr("stroke", "red").attr("stroke-width", 2).attr("d", lineDeaths4)
            .attr("opacity", 0).transition().duration(1000).attr("opacity", 1);

        setTimeout(() => {
            svgCases4.selectAll(".annotation").remove();
            svgCases4.append("circle").attr("class", "annotation").attr("cx", xScale4(peakDateCases))
                .attr("cy", yScaleCases4(peakCases)).attr("r", 5).attr("fill", "blue");

            svgCases4.append("text").attr("class", "annotation").attr("x", xScale4(peakDateCases) + 15)
                .attr("y", yScaleCases4(peakCases)).attr("alignment-baseline", "middle")
                .style("font-size", "12px").style("font-weight", "bold").text(`Peak New Cases`);

            svgCases4.append("text").attr("class", "annotation").attr("x", xScale4(peakDateCases) + 15)
                .attr("y", yScaleCases4(peakCases) + 15).attr("alignment-baseline", "middle")
                .style("font-size", "12px").style("font-weight", "bold")
                .text(`${d3.timeFormat("%B %d, %Y")(peakDateCases)}: ${peakCases}`);

            if (firstVaxDate) {
                svgCases4.append("circle").attr("class", "annotation").attr("cx", xScale4(firstVaxDate.date))
                    .attr("cy", yScaleCases4(firstVaxDate.covid_cases)).attr("r", 10).attr("fill", "green");

                svgCases4.append("text").attr("class", "annotation").attr("x", xScale4(firstVaxDate.date) + 15)
                    .attr("y", yScaleCases4(firstVaxDate.covid_cases)).attr("alignment-baseline", "middle")
                    .style("font-size", "12px").style("font-weight", "bold").text(`Vaccinations Started:`);

                svgCases4.append("text").attr("class", "annotation").attr("x", xScale4(firstVaxDate.date) + 15)
                    .attr("y", yScaleCases4(firstVaxDate.covid_cases) + 15).attr("alignment-baseline", "middle")
                    .style("font-size", "12px").style("font-weight", "bold")
                    .text(`${d3.timeFormat("%B %d, %Y")(firstVaxDate.date)}`);
            }

            svgDeaths4.selectAll(".annotation").remove();
            svgDeaths4.append("circle").attr("class", "annotation").attr("cx", xScale4(peakDateDeaths))
                .attr("cy", yScaleDeaths4(peakDeaths)).attr("r", 5).attr("fill", "red");

            svgDeaths4.append("text").attr("class", "annotation").attr("x", xScale4(peakDateDeaths) + 15)
                .attr("y", yScaleDeaths4(peakDeaths)).attr("alignment-baseline", "middle")
                .style("font-size", "12px").style("font-weight", "bold").text(`Peak New Deaths`);

            svgDeaths4.append("text").attr("class", "annotation").attr("x", xScale4(peakDateDeaths) + 15)
                .attr("y", yScaleDeaths4(peakDeaths) + 15).attr("alignment-baseline", "middle")
                .style("font-size", "12px").style("font-weight", "bold")
                .text(`${d3.timeFormat("%B %d, %Y")(peakDateDeaths)}: ${peakDeaths}`);

            if (firstVaxDate) {
                svgDeaths4.append("circle").attr("class", "annotation").attr("cx", xScale4(firstVaxDate.date))
                    .attr("cy", yScaleDeaths4(firstVaxDate.covid_deaths)).attr("r", 10).attr("fill", "green");

                svgDeaths4.append("text").attr("class", "annotation").attr("x", xScale4(firstVaxDate.date) + 15)
                    .attr("y", yScaleDeaths4(firstVaxDate.covid_deaths)).attr("alignment-baseline", "middle")
                    .style("font-size", "12px").style("font-weight", "bold").text(`Vaccinations Started:`);

                svgDeaths4.append("text").attr("class", "annotation").attr("x", xScale4(firstVaxDate.date) + 15)
                    .attr("y", yScaleDeaths4(firstVaxDate.covid_deaths) + 15).attr("alignment-baseline", "middle")
                    .style("font-size", "12px").style("font-weight", "bold")
                    .text(`${d3.timeFormat("%B %d, %Y")(firstVaxDate.date)}`);
            }
        }, 1000);
    }

    updateChart4(stateData[0].state);
    d3.select("#scene4 #state-select").on('change', function () {
        const selectedState = d3.select(this).property("value");
        updateChart4(selectedState);
    });
});
