// Define any URLs needed
var GLOBAL_MAP_URL = "https://raw.githubusercontent.com/jchen2186/water-around-the-world/master/geojson/countries.geojson";
var DRINKING_WATER_PERCENT_URL = "https://raw.githubusercontent.com/jchen2186/water-around-the-world/master/data/aquastat.csv";

// Select objects from DOM
var svgMap = d3.select("#svgMap");
var gMap = svgMap.append("g")

var svgBarChart = d3.select("#svgBarChart");
var gChart = svgBarChart.append("g");

// Load the data and create the plots
d3.queue()
  .defer(d3.json, GLOBAL_MAP_URL)
  .defer(d3.csv, DRINKING_WATER_PERCENT_URL)
  .await(createPlots);

// Main function that creates all of the plots
function createPlots(error, countries, waterData) {
  // Create chart
  createChart(gChart, waterData);

  // Create the map
  createMap(gMap, countries, waterData);
}

// Creates the initial bar charts
function createChart(g, waterData) {
  let data = waterData.filter(function(row) {
    return row['Variable Name'] == "Total population with access to safe drinking-water (JMP)";
  }).map(row => {
    return [row['Area'],
            row['Variable Name'],
            parseInt(row['Year']),
            parseFloat(row['Value'])];
  }).sort((x, y) => {
    return d3.ascending(x[3], y[3]);
  }).slice(0, 25);

  let maxValue = 100;
  let xShift = 250;
  
  // Generate x and y scaling for bar chart
  let x = d3.scaleLinear()
    .domain([0, maxValue])
    .rangeRound([0, 200]);
  
  let y = d3.scaleBand()
    .domain(data.map(d => d[0]))
    .rangeRound([50, 550]);
  
  // x-axis ticks and labels on the top
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${xShift}, 50)`)
    .call(d3.axisTop(x)
      .ticks(4)
      .tickFormat(d3.format(".2s")));
  
  // x-axis ticks and labels on the bottom with the title of x-axis
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${xShift}, 550)`)
    .call(d3.axisBottom(x)
      .ticks(4)
      .tickFormat(d3.format(".2s")))
    .append("text")
      .attr("class", "x-label")
      .attr("x", 100)
      .attr("y", 40)
      .text("% of Population with Access to Safe Drinking Water");

  // Add vertical grid lines
  g.append("g")
    .attr("class", "grid x-axis")
    .attr("transform", `translate(${xShift}, 50)`)
    .call(d3.axisTop(x)
      .ticks(4)
      .tickSize(-500)
      .tickFormat(""));
  
  // Afterwards, call updateChart() to fill chart with bars
  updateChart(g, waterData);

  // Update data and bar chart every time the options change
  d3.selectAll(".chart-filter")
    .on("change", function() {
      updateChart(g, waterData)
    });
}

// Helper function to get the options from the Display Options box
function getChosenOptions() {
  let chartFilterElements = d3.selectAll(".chart-filter")._groups[0];
  let options = {};

  for (let i = 0; i < chartFilterElements.length; i++) {
    let el = chartFilterElements[i];
    if (el.type == "radio" && el.checked) {
      options[el.name] = el.value;
    }
    else if (el.type == "range") {
      options[el.id] = parseInt(el.value);
    }
    else if (el.type == "checkbox") {
      options[el.name] = el.checked;
    }
  }
  return options;
}

// Helper function to get the filtered data based on the Display Options box
function getUpdatedData(g, waterData) {
  let options = getChosenOptions();
  let populationType = options["population-type"];
  let include100Percent = options["100-percent"];
  let minPercent = options["min"];
  let maxPercent = options["max"];

  let data = waterData.filter(function(row) {
    // Filter by population type
    if (populationType == "total") {
      return row["Variable Name"] == "Total population with access to safe drinking-water (JMP)";
    }
    else if (populationType == "urban") {
      return row["Variable Name"] == "Urban population with access to safe drinking-water (JMP)";
    }
    else if (populationType == "rural") {
      return row["Variable Name"] == "Rural population with access to safe drinking-water (JMP)";
    }
  }).filter(function(row) {
    // Filter to include or exclude countries with 100% access to clean water
    return (include100Percent) ? row : row["Value"] != 100;
  }).filter(function(row) {
    // Filter to include only the countries that fall within the range
    return minPercent <= row["Value"] && row["Value"] <= maxPercent;
  }).map(row => {
    return [row['Area'],
            row['Variable Name'],
            parseInt(row['Year']),
            parseFloat(row['Value'])];
  })
  // Sort to the chosen option
  .sort((x, y) => {
    if (options["sort"] == "ascending") {
      return d3.ascending(x[3], y[3]);
    }
    else {
      return d3.descending(x[3], y[3]);
    }
  })
  // Select the number of countries as chosen
  .slice(0, options["num-countries"]);

  return data;
}

function updateChart(g, waterData) {
  let options = getChosenOptions();
  let data = getUpdatedData(g, waterData);
  let xShift = 250;
  let maxValue = 100;
  let t = d3.transition().duration(500);

  console.log(options);
  console.log(data);


  // Generate x and y scaling for bar chart
  let x = d3.scaleLinear()
    .domain([0, maxValue])
    .rangeRound([0, 200]);
  
  let y = d3.scaleBand()
    .domain(data.map(d => d[0]))
    .rangeRound([50, 550]);

  // Clear previous y-axis if any
  d3.selectAll("g.y-axis").remove();

  // y-axis ticks and labels
  g.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${xShift}, -2)`)
    .call(d3.axisLeft(y));

  // Enter, merge, and exit for bars
  let bars = g.selectAll(".bar")
    .data(data);

  bars.enter().append("rect")
    .attr("class", "bar")
    .attr("x", xShift)
    .attr("y", d => y(d[0]))
    .attr("width", 0)
    .style("opacity", 0)
  .merge(bars)
    .transition(t)
    .attr("x", xShift)
    .attr("y", d => y(d[0]))
    .attr("width", d => x(d[3]))
    .attr("height", (y.range()[1] - 100) / data.length)
    .style("opacity", 1);
  
  bars.exit()
    .transition(t)
    .style("opacity", 0);
}

// Creates the initial map, which contains the data for the total population
function createMap(g, countries, waterData) {
  let data = waterData.filter(function(row) {
    return row['Variable Name'] == "Total population with access to safe drinking-water (JMP)";
  }).map(row => {
    return [row['Area'],
            row['Variable Name'],
            parseInt(row['Year']),
            parseFloat(row['Value'])];
  });

  let projection = d3.geoMercator();
  
  let path = d3.geoPath()
    .projection(projection);
  
  // Draw outlines of the countries
  g.selectAll(".country")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("id", d => d.properties.name)
    .attr("d", path)
    .on("mouseover", showCountryInfo);
  
  let color = d3.scaleQuantize()
    .domain([0, 100])
    .range(d3.schemeBlues[9]);

  let x = d3.scaleLinear()
    .domain(d3.extent(color.domain()))
    .rangeRound([0, 400]);

  // Create the legend group
  let legend = g.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(50, 500)");

  legend.selectAll("rect")
    .data(color.range().map(d => color.invertExtent(d)))
    .enter().append("rect")
      .attr("class", "legend-color-box")
      .attr("height", 5)
      .attr("x", d => x(d[0]))
      .attr("y", 0)
      .attr("width", d => x(d[1]) - x(d[0]))
      .attr("fill", d => color(d[0]));
  
  legend.append("text")
    .attr("class", "legend-title")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "Black")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Percentage of Population with Access to Safe Drinking Water");

  legend.call(d3.axisBottom(x)
    .tickSize(7)
    .tickFormat(d3.format(".1s"))
    .tickValues(color.range()
      .map(d => color.invertExtent(d)[0])))
    .select(".domain")
    .remove();

  // Draw last tick
  let lastTick = legend.append("g")
    .attr("class", "tick")
    .attr("opacity", 1)
    .attr("transform", "translate(400, 0)");

  lastTick.append("line")
    .attr("stroke", "#000")
    .attr("y2", 7);
  
  lastTick.append("text")
    .attr("fill", "#000")
    .attr("y", 10)
    .attr("dy", "0.71em")
    .text("100");
  
  // Draw initial info box
  var info = g.append("g")
    .attr("class", "info")
    .attr("transform", "translate(525, 460)");
  
  info.append("rect")
    .attr("class", "info-box")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 400)
    .attr("height", 80);
  
  info.append("text")
    .attr("class", "info-text initial")
    .text(`Hover over each country for more info`)
    .attr("x", 40)
    .attr("y", 45);
  
  // Afterwards, call updateMap() to fill countries with color
  updateMap(g, waterData, "total");

  d3.selectAll(".map-filter")
    .on("change", function() {
      updateMap(g, waterData, this.value)
    });
}

function updateMap(g, waterData, dataType = "total") {
  // Filter data based on the population
  let data = waterData.filter(function(row) {
    if (dataType == "total") {
      return row['Variable Name'] == "Total population with access to safe drinking-water (JMP)";
    }
    else if (dataType == "rural") {
      return row['Variable Name'] == "Rural population with access to safe drinking-water (JMP)";
    }
    else if (dataType == "urban") {
      return row['Variable Name'] == "Urban population with access to safe drinking-water (JMP)";
    }
  }).map(row => {
    return [row['Area'],
            row['Variable Name'],
            parseInt(row['Year']),
            parseFloat(row['Value'])];
  });

  let minValue = 0;
  let maxValue = 100;
  let steps = 9;
  
  let color = d3.scaleThreshold()
    .domain(d3.range(0, maxValue, maxValue / steps))
    .range(d3.schemeBlues[steps]);
  
  let countries = g.selectAll(".country")
    .data(data, d => d.properties ? d.properties.name : d[0]);

  let x = d3.scaleLinear()
    .domain([minValue, maxValue])
    .rangeRound([0, 500]);
  
  let legend = d3.selectAll(".legend");

  // Update the countries with their color
  countries.transition()
    .duration(300)
    .style("fill", d => color(d[3]));
  
  // Remove the previous info box
  d3.selectAll("rect.info-box").remove();
  d3.selectAll("text.info-text").remove();
  
  // Draw initial info box
  let info = d3.selectAll(".info");
  
  info.append("rect")
    .attr("class", "info-box")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 400)
    .attr("height", 80);
  
  info.append("text")
    .attr("class", "info-text initial")
    .text(`Hover over each country for more info`)
    .attr("x", 40)
    .attr("y", 45);
}

function showCountryInfo(data) {
  // Remove the previous info box
  d3.selectAll("rect.info-box").remove();
  d3.selectAll("text.info-text").remove();
  
  let info = d3.selectAll(".info");
  
  info.append("rect")
    .attr("class", "info-box")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 400)
    .attr("height", 80);
  
  info.append("text")
    .attr("class", "info-text")
    .text(`Country: ${data[0]}`)
    .attr("x", 20)
    .attr("y", 30);

  info.append("text")
    .attr("class", "info-text")
    .text(`${data[1].slice(0, -6)}: ${data[3]}%`)
    .attr("x", 20)
    .attr("y", 55);
}