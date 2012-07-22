var WebFontConfig = {
  google: { families: [] }
};
function loadFonts() {
  var wf = document.createElement('script');
  wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
};

var width = 960,
    height = 600;

var color = d3.scale.category20();
var GLOBAL_COLOR_ID = 0;
var ZERO_DEG_COLOR_ID = 1;

var isDragging = false;
var dragStart = {};

var force = d3.layout.force()
    .charge(-1500)
    .linkDistance(250)
    .size([width, height]);

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

var selectedNode = null;

function redraw(json) {
  for (var i = 0; i < json.nodes.length; i++) {
    WebFontConfig.google.families.push(json.nodes[i].name);
  }
  loadFonts();

  force
      .nodes(json.nodes)
      .links(json.links)
      .start();

  var topGroup = svg.append("svg").style("overflow", "visible");

  var link = topGroup.selectAll("line.link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link")
      .attr('weight', function(d) { return d.count; })
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = topGroup.selectAll("g.node")
      .data(json.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.each(function(d){ if (d.name == "Nunito") selectedNode = d})
    
  node.append("rect")
      .attr("width", function(d) { return 12 * d.name.length; })
      .attr("height", 40)
      .attr("x", function(d) { return -3 * d.name.length; })
      .attr("y", -15)
      .attr("rx", 5)
      .attr("ry", 5)
      .style("fill", function(d) { return "rgba(0,0,0,0)"}) //color(d.group || 0); })
      .on("click", onClick)
      .on("mouseout", function(cow){return onHover(selectedNode)})
      .on("mouseover", onHover)

  node.append("text")
      .attr("text-anchor", "middle")
      .style("font-family", function(d) { return d.name; })
      .text(function(d) { return d.name; })
  
      force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ")"; });
  });

  svg.on("mousedown", function() {
    isDragging = true;
    dragStart.x = d3.event.clientX;
    dragStart.y = d3.event.clientY;
    dragStart.svgX = parseInt(topGroup.attr("x"), 10);
    dragStart.svgY = parseInt(topGroup.attr("y"), 10);
    svg.on("mousemove", function() {
      topGroup.attr("x", d3.event.clientX - dragStart.x + dragStart.svgX);
      topGroup.attr("y", d3.event.clientY - dragStart.y + dragStart.svgY);
    });
  });

  svg.on("mouseup", function() {
    isDragging = false;
    svg.on("mousemove", null);
  });

  function onHover(d){
    //console.log("hover lolz: " + d.name)
    d3.select("#title2") 
      .style("font-family", function(moo) { return d.name; })
      .html(d.name)
      
    d3.select("#lorem2") 
      .style("font-family", function(moo) { return d.name; })

  }
  function onClick(d) {
    selectedNode = d;
    topGroup.transition().duration(1000)
      .attr("x", width/2 - d.x)
      .attr("y", height/2 - d.y);

    //svg.selectAll("rect").style("fill", function(d) { return color(GLOBAL_COLOR_ID); });
    //d3.select(this).style("fill", color(ZERO_DEG_COLOR_ID));
    for (var i = 0; i < json.nodes.length; i++) {
      json.nodes[i].group = GLOBAL_COLOR_ID;
    }
    d.group = ZERO_DEG_COLOR_ID;
    var seen = [[d]];
    var allSeen = [d];
    var allSeenLinks = [];
    for (var i = 0; i < 20; i++){
      var boundary = seen[seen.length - 1];
      var newBoundary = [];

      for(var j in boundary){
        boundary[j].group = i;
        var children = getAllNeighbours(boundary[j]);
        for(var c in children){
          var childTarget = children[c][0];
          var childLine = children[c][1];
          if (allSeen.indexOf(childTarget) === -1){
            newBoundary.push(childTarget);
            childLine.group = i + 0.1;
            allSeen.push(childTarget);
          }
          if (allSeenLinks.indexOf(childLine) === -1) {
            allSeenLinks.push(childLine);
          }
        }
      }
      seen.push(newBoundary);
    }
    topGroup.selectAll("g.node")
       .data(json.nodes)
       .selectAll("text")
       .style("opacity", function(d) { return 1 - d.group / 6; })
       .style("font-size", function(d) { return 32 - d.group * 5 });
       //.style("fill", function(d) { return 'hsl(204,' + (70 - 15 * d.group) + '%,' + (50 + d.group * 15) + '%)'; });

    topGroup.selectAll("line.link")
      .data(json.links)
      .style("stroke", function(d) { return "hsl(170," + (50 - 15 * d.group) + '%,' + (30 + d.group * 18) + '%)'; })
      .attr('weight', function(d) { if (d.group == 1) return d.count * 100; else return d.count; })
      .style("stroke-width", function(d) { return Math.max(3 - d.group, 0); });

    d3.select("#title1") 
      .style("font-family", function(moo) { return d.name; })
      .html(d.name)
      
    d3.select("#lorem1") 
      .style("font-family", function(moo) { return d.name; })
      //topGroup.selectAll("g.node,line.link")
      //.sort(function(a,b) { return a.group < b.group; });

    force.stop();
    force.start();
  }

  function getAllNeighbours(d) {
    var result = [];
    for (var i = 0; i < json.links.length; i++) {
      if (json.links[i].source == d) {
        result.push([json.links[i].target, json.links[i]]);
      }
      else if (json.links[i].target == d) {
        result.push([json.links[i].source, json.links[i]]);
      }
    }
    return result;
  }
  onClick(selectedNode)
}

d3.json("font_data_2.json", redraw);
