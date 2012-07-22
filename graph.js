var width = 1080,
    height = 500;

var color = d3.scale.category20();
var GLOBAL_COLOR_ID = 0;
var ZERO_DEG_COLOR_ID = 1;
var FIRST_DEG_COLOR_ID = 2;

var force = d3.layout.force()
    .charge(-1500)
    .linkDistance(300)
    .size([width, height]);

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

var selectedNode = null;

function redraw(json) {
  force
      .nodes(json.nodes)
      .links(json.links)
      .start();

  var topGroup = svg.append("svg").style("overflow", "visible");

  var link = topGroup.selectAll("line.link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = topGroup.selectAll("g.node")
      .data(json.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("rect")
      .attr("width", function(d) { return 6 * d.name.length; })
      .attr("height", 30)
      .attr("x", function(d) { return -3 * d.name.length; })
      .attr("y", -15)
      .attr("rx", 5)
      .attr("ry", 5)
      .style("fill", function(d) { return color(d.group || 0); })
      .on("click", onClick);

  node.append("text")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ")"; });
  });

  function onClick(d) {
    topGroup.transition().duration(1000)
      .attr("x", width/2 - d.x)
      .attr("y", height/2 - d.y);

    //svg.selectAll("rect").style("fill", function(d) { return color(GLOBAL_COLOR_ID); });
    //d3.select(this).style("fill", color(ZERO_DEG_COLOR_ID));
    for (var i = 0; i < json.nodes.length; i++) {
      json.nodes[i].group = GLOBAL_COLOR_ID;
    }
    d.group = ZERO_DEG_COLOR_ID;
    for (var i = 0; i < json.links.length; i++) {
      if (json.links[i].source == d) {
        json.links[i].target.group = FIRST_DEG_COLOR_ID;
      }
      else if (json.links[i].target == d) {
        json.links[i].source.group = FIRST_DEG_COLOR_ID;
      }
    }
    topGroup.selectAll("g.node")
       .data(json.nodes)
       .selectAll("rect")
       .style("fill", function(d) { return color(d.group || 0); });
  }
}

d3.json("font_data_2.json", redraw);
