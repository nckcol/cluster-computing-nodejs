module.exports = function divideGraph(graph, number) {
  const verticesPerWorker = Math.floor(graph.nodes.length / number);

  let divided = [];

  for (let i = 0; i < number; i++) {
    divided[i] = {
      vertices: [],
      edges: []
    };
  }

  graph.nodes.forEach((item, index) => {
    const workerNumber = Math.min(
      Math.floor(index / verticesPerWorker),
      number - 1
    );

    divided[workerNumber].vertices.push(item);
  });

  graph.edges.forEach(item => {
    const workerNumber = Math.min(
      Math.floor(item.target / verticesPerWorker),
      number - 1
    );

    divided[workerNumber].edges.push(item);
  });

  return divided;
};
