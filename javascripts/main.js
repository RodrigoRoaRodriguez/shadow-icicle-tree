/** @type {number} */
var height, width;
/** @type {d3.scale.linear} */
var x, y;
/** @type {function} */
var widthValue, shadowValue;

var shadowSelect = document.getElementById('selectShadowValue');
var widthSelect = document.getElementById('selectWidthValue');
/** @type {d3.map} A list of options for the select elements. */
var accessors = d3.map();
accessors.set("Time-extent", (d) => 1);
accessors.set("Lifetime Total Likes", (d) => d["Lifetime Total Likes"]);
accessors.set("Daily New Likes", (d) => d["Daily New Likes"]);
accessors.set("Daily Unlikes", (d) => d["Daily Unlikes"]);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  tooltip.append('h1');
  tooltip.append('p').attr('id', 'shadowValue');
  tooltip.append('p').attr('id', 'shadowPercentage');

d3.selectAll('select')
  .selectAll('option')
  .data(accessors.keys())
  .enter().append('option')
  .text((d)=> d);

var svg = d3.select("#box-tree").append("svg")
  .attr("id", "chart")
  // .style("border-style", "dotted")
  .style("display", 'block')
  .style("margin", '0 auto')
  ;

var color = (i) => d3.hcl(i * 47, 80, 80).toString();

var widthPartition = d3.layout.partition()
  .value(accessors.get(option(widthSelect)))
  .sort((a,b)=> a.name > b.name);

var shadowHierarchy = d3.layout.hierarchy()
  .value(accessors.get(option(shadowSelect)));

var boxes;
d3.json("../data/dataTree.json", function(error, json) {
  if (error) throw error;
  data = json;
  boxes = svg.append('g').selectAll("rect")
    .data(widthPartition(json))
  .enter().append("rect")
    .attr("fill", (_, i) => color(i))
    .on('click', clicked)
    .style('stroke', 'white')
    .style('stroke-width', '1')
    .on("mouseover", showTooltip)
    .on("mousemove", placeTooltip)
    .on("mouseout", hideTooltip)
    ;

  shadows = svg.append('g').selectAll("rect")
    .data(shadowHierarchy(json))
  .enter().append("rect")
    .attr('class', 'shadow')
    .attr("fill", 'black')
    .style('opacity', '0.3')
    ;

  boxesAndShadows = svg.selectAll("g").selectAll("rect");

  updateSizes();
  window.onresize = updateSizes;
  });


////////////////////////////////////////////////////////////////////////////////
// END OF SEQUENTIAL CODE
////////////////////////////////////////////////////////////////////////////////

var shadow = (d) =>
  d.parent === undefined ? 0 : // Is it root, if so no shadow
  d.parent.value === 0? 1 :// If parent.value is 0 then d.value is 0 so shadow.
  1 - d.value / d.parent.value;//

function getSizes() {
  //Update size variables
  height = window.innerHeight * 0.70;
  width = window.innerWidth * 0.80;
}

function updateScales() {
  x = d3.scale.linear()
    .range([0, width]);

  y = d3.scale.linear()
    .range([0, height]);
}

function updateSizes() {
  getSizes();
  updateScales();
  //Update svg canvas
  svg.attr("width", width)
    .attr("height", height);

  boxesAndShadows
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y); })
    .attr("width", function(d) { return x(d.dx); })
    ;
  boxes
    .attr("height", function(d) { return y(d.dy); })
    ;
  shadows
    .attr("height", (d)=> y(d.dy)*shadow(d))
    ;
}

function clicked(d) {
  x.domain([d.x, d.x + d.dx]);
  y.domain([d.y, 1])
  .range([d.y ? 15 : 0, height]); //Is this root? if not leave 20px on top.

  boxes.transition().duration(500)
     .attr("x", function(d) { return x(d.x); })
     .attr("y", function(d) { return y(d.y); })
     .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
     .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
      ;
  shadows.transition().duration(500)
     .attr("x", function(d) { return x(d.x); })
     .attr("y", function(d) { return y(d.y); })
     .attr("width", function(d) { return x(d.x + d.dx) - x(d.x);})
     .attr("height", function(d) { return (y(d.y + d.dy) - y(d.y))*shadow(d); })
        ;
}

function option(select){
  return select.options[select.selectedIndex].value;
}

function updateShadowValue(){
  shadowHierarchy.value(accessors.get(option(shadowSelect)));
  shadows.data(shadowHierarchy(data));

  shadows
  .attr("x", function(d) { return x(d.x); })
  .attr("y", function(d) { return y(d.y); })
  .attr("width", function(d) { return x(d.dx); })
  .transition().duration(500)
  .attr("height", (d)=> y(d.dy)*shadow(d));
}

function updateWidthValue(){
  widthPartition.value(accessors.get(option(widthSelect)));
  boxes.data(widthPartition(data));
  updateSizes();
}

function showTooltip(d, i){
  tooltip.transition()
    .duration(400)
    .style("opacity", .9);

  tooltip.select('h1')
    .text(d.name ? d.name : d.Date)


  tooltip.select('#shadowValue')
    .text(option(shadowSelect))
    .append('strong')
    .text(d.value)
    ;
  if(d.parent){
  tooltip.select('#shadowPercentage')
    .text('% of parent')
    .append('strong')
    .text( Math.round(100*(1-shadow(d)))+'%' )
    ;
  }else tooltip.select('#shadowPercentage').text('')


}

function placeTooltip(){
  tooltip
    .style("left", (d3.event.x) + "px")
    .style("top", (d3.event.y) + "px");
}

function hideTooltip(){
  // tooltip.transition()
  //   .duration(400)
  //   .style("opacity", 0);
}
