var data = refugees.map(obj => [obj['Year'], Object.entries(obj)
  .filter(item => { return item[0] !== 'Year'; })
  .reduce((total, item) => { return total + item[1]; },
         0)]);

console.log(data);


var maxValue = d3.max(data, d => d[1]);
var x = d3.scaleLinear()
            .domain([0, maxValue])
            .rangeRound([0, 230]);
var y = d3.scaleBand()
            .domain(data.map(d => d[0]))
            .rangeRound([50, 950]);

var svg = d3.select("svg");
var g = svg.append("g");

// another group for the axis
g.append("g")
  .attr("class", "axis--y")
  .attr("transform", "translate(55, -2)")
  .call(d3.axisLeft(y))
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", -y.range()[1]*0.5)
    .attr("y", -35)
    .text("Year");

g.append("g")
  .attr("class", "axis--x")
  .attr("transform", "translate(60, 950)")
  .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")))
  .append("text")
    .attr("class", "label")
    .attr("x", 100)
    .attr("y", 40)
    .text("Refugee Count");

g.append("g")
  .attr("class", "axis--x")
  .attr("transform", "translate(60, 50)")
  .call(d3.axisTop(x).ticks(4).tickFormat(d3.format(".2s")));

g.append('g')
  .attr('class', 'grid axis--x')
  .attr('transform', 'translate(60, 50)')
    .call(d3.axisTop(x).ticks(4).tickSize(-900).tickFormat(""));

var tooltip = d3.select("body").append("div")
                .attr("class", "tooltip");

g.selectAll('.bar')
  .data(data)
  .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 60)
    .attr('y', d => y(d[0]))
    .attr('width', d => x(d[1]))
    .attr('height', 18)
    .on("mouseover", function (d) {
      d3.select(this)
        .transition().ease(d3.easeBounce).duration(500)
        .attr("x", 60-10)
        .attr("y", d => (y(d[0]) - 2))
        .attr("width", d => (x(d[1]) + 20))
        .attr("height", y.bandwidth() + 2)
      tooltip.text(d[1]);
      return tooltip.style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .transition().duration(300)
        .attr('x', 60)
        .attr('y', d => y(d[0]))
        .attr('width', d => x(d[1]))
        .attr('height', 18);
      tooltip.style("visibility", "hidden");
    })
    .on("mousemove", function (d) {
      tooltip.style("top", d3.event.pageY + 30 + "px")
             .style("left", d3.event.pageX + 30 + 
"px")
});