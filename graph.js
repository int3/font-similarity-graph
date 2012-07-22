var loadImg = document.getElementById('loadImg');
loadImg.style.top = "200px";

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
}

var width = 960,
    height = 600;

var color = d3.scale.category20();
var GLOBAL_COLOR_ID = 0;
var ZERO_DEG_COLOR_ID = 1;

var LOREM_IPSUM = "I saw for the first time the earth's shape. I could easily see the shores of \
continents, islands, great rivers, folds of the terrain, large bodies of water. \
The horizon is dark blue, smoothly turning to black. . . the feelings which \
filled me I can express with one word&mdash;joy. ";

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

function init(json) {
  for (var i = 0; i < json.nodes.length; i++) {
    WebFontConfig.google.families.push(json.nodes[i].name);
  }
  WebFontConfig.active = function() {
    draw(json);
  };
  loadFonts();

  force
    .nodes(json.nodes)
    .links(json.links)
    .start();
}

function draw(json) {
  loadImg.style.display = "none";
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
      .attr("width", function(d) { return 14 * d.name.length; })
      .attr("height", 40)
      .attr("x", function(d) { return -6 * d.name.length; })
      .attr("y", -40)
      .style("fill", function(d) { return "rgba(0,0,0,0)"})
      .on("click", function(d) {
        d3.select(this.parentNode).select("text")
          .style("stroke", "none")
          .style("font-size", function(d) { return 32 - d.group * 5 });
        onClick.call(this, d);
      })
      .on("mouseout", function(){
        d3.select(this.parentNode).select("text")
          .style("stroke", "none")
          .style("font-size", function(d) { return 32 - d.group * 5 });
        return displaySidebarForNode(selectedNode);
      })
      .on("mouseover", onHover);

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

  function onHover(d) {
    d3.select(this.parentNode).select("text")
      .style("stroke", "#fcc")
      .style("font-size", function(d) { return 32 });
    displaySidebarForNode(d);
  }

  function onClick(d) {
    selectedNode = d;
    display(d);
    displaySidebarForNode(d);
  }

  function display(d) {
    topGroup.transition().duration(1000)
      .attr("x", width/2 - d.x)
      .attr("y", height/2 - d.y);

    for (var i = 0; i < json.nodes.length; i++) {
      json.nodes[i].group = GLOBAL_COLOR_ID;
    }

    topGroup.selectAll("line.link").each(function(x){x.group = 10});
    d.group = ZERO_DEG_COLOR_ID;
    var seen = [[d]];
    var allSeen = [d];
    var allSeenLinks = [];
    for (var i = 0; i < 20; i++){
      var boundary = seen[seen.length - 1];
      var newBoundary = [];

      for(var j in boundary){
        boundary[j].group = i;
        var children = getAllNeighbors(boundary[j]);
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

    topGroup.selectAll("line.link")
      .data(json.links)
      .style("stroke", function(d) { return "hsl(200," + (100 * Math.pow(0.9, d.group)) + '%,' + 100 * (1 - 0.6 * Math.pow(0.9, d.group)) + '%)'; })
      .attr('weight', function(d) { if (d.group == 1) return d.count * 100; else return d.count; })
      .style("stroke-width", function(d) { return Math.max(3 - d.group, 0); });

    force.stop();
    force.start();
  }

  function displaySidebarForNode(d) {
    var neighbors = getAllNeighbors(d);
    for (var i = 0; i < neighbors.length; i++)
      neighbors[i] = neighbors[i][0];
    neighbors.unshift(d);
    var sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";
    function sideClick(elem) {
      var ps = sidebar.getElementsByTagName("p");
      var toggleShow = elem.nextSibling.style.display !== "block";
      for (var i = 1; i < ps.length; i++) {
        ps[i].style.display = "none";
      }
      if (toggleShow)
          elem.nextSibling.style.display = "block";
    };

    for (var i = 0; i < neighbors.length; i++) {
      var div = document.createElement("div");
      var h2 = document.createElement("h2");
      var a = document.createElement("a");
      a.innerHTML = "&rarr;";

      (function(ii){
        a.onclick = function(){
          onClick(neighbors[ii])
          topGroup.selectAll("g.node")
            .selectAll("text")
            .style("stroke", "none");
        }

        a.onmouseover = function() {
            topGroup.selectAll("g.node")
              .filter(function(d) { return d == neighbors[ii]; })
              .selectAll("text")
              .style("font-size", function(d) { return 32 })
              .style("stroke", "#fcc");
        }

        a.onmouseout = function() {
          topGroup.selectAll("g.node")
            .filter(function(d) { return d == neighbors[ii]; })
            .selectAll("text")
            .style("font-size", function(d) { return 32 - d.group * 5 })
            .style("stroke", "none");
        }
      })(i)
      h2.className = "sidefont";
      h2.innerText = neighbors[i].name;
      h2.style.fontFamily = neighbors[i].name;
      var p = document.createElement("p");
      h2.appendChild(a)
      p.innerHTML = LOREM_IPSUM;
      p.style.fontFamily = neighbors[i].name;
      var a = document.createElement("a")
      a.href = "http://www.google.com/webfonts/specimen/" + neighbors[i].name
      a.target = "_blank"
      a.innerHTML = "view on google.com"
      p.appendChild(a);
      div.appendChild(h2);
      div.appendChild(p);

      sidebar.appendChild(div);
      if (i > 0) {
        p.style.display = "none";
        h2.style.fontSize = "small";
        h2.style.fontSize = "18px";
        h2.style.lineHeight = "1.5em";
      }else{
        p.style.display="block"
      }

      d3.select(h2).on("click", function(d){sideClick(this)})
      if (i == 0) sideClick(h2)
    }
  }

  function getAllNeighbors(d) {
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
  onClick(selectedNode);
}

d3.json("font_data_2.json", init);
