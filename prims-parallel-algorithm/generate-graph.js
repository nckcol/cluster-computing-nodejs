const fs = require("fs");
const generateGraph = require("./watts-strogats-graph");
const graph = generateGraph(20, 4, 0.3);

fs.writeFile("./test-graph.json", JSON.stringify(graph), function() {
  console.log("Successfully generate graph");
});
