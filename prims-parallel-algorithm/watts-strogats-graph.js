function rand(max) {
  return Math.floor(Math.random() * max);
}

module.exports = function(n, K, beta) {
  let nodes = [];
  let edges = [];
  let pool = {};

  K = K >> 1; // divide by two
  for (let i = 0; i < n; i++) {
    nodes.push({ label: "node " + i });
    // create a latice ring structure
    for (let j = 1; j <= K; j++) {
      const source = i;
      const target = (i + j) % n;
      pool[source + "-" + target] = edges.length;
      edges.push({ source, target, weight: rand(100) });
    }
  }
  // rewiring of edges
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= K; j++) {
      // for every pair of nodes
      if (Math.random() > beta) {
        continue;
      }

      let t;

      do {
        t = Math.floor(Math.random() * (n - 1));
      } while (t == i || pool[i + "-" + t]);

      let target = (i + j) % n;
      edges[pool[i + "-" + target]].target = t; // rewire
      pool[i + "-" + t] = pool[i + "-" + target];
      delete pool[i + "-" + target];
    }
  }

  return { nodes, edges };
};
