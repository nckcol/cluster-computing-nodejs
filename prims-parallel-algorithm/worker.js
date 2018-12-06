const zmq = require("zeromq");
const sock = zmq.socket("dealer");
const EVENTS = require("./events");

sock.connect("tcp://127.0.0.1:3000");
console.log("Worker connected to port 3000");

let minEdges = [];
let done = [];

let edgeTable = [];
let subgraph = {};

function initWorker() {
  subgraph.edges.forEach(({ source, target, weight }) => {
    if (!edgeTable[source]) {
      edgeTable[source] = [];
    }

    edgeTable[source].push({
      target,
      weight
    });

    if (!edgeTable[target]) {
      edgeTable[target] = [];
    }

    edgeTable[target].push({
      target: source,
      weight
    });
  });

  console.log(edgeTable);
}

function recalculateEdges(added) {
  done.push(added);
  minEdges[added] = 0;

  if (!edgeTable[added]) {
    return null;
  }

  edgeTable[added].forEach(edge => {
    if (done.includes(edge.target)) {
      return;
    }

    if (!minEdges[edge.target] || minEdges[edge.target].weight > edge.weight) {
      minEdges[edge.target] = edge;
    }
  });
}

function calculate(added) {
  if (added !== null) {
    recalculateEdges(added);
  }

  const edges = minEdges.filter(Boolean).sort((a, b) => a.weight - b.weight);

  console.log(added, edges);

  return edges[0];
}

sock.on("message", function(msg) {
  console.log("MESSAGE", msg.toString());
  try {
    const action = JSON.parse(msg.toString());

    console.log(action.type);

    switch (action.type) {
      case EVENTS.INIT: {
        subgraph = action.payload.subgraph;
        initWorker();
        break;
      }

      case EVENTS.WORK: {
        const { current } = action.payload;
        const result = calculate(current);
        console.log(result);
        const data = JSON.stringify({
          type: EVENTS.RESULT,
          payload: result
        });
        sock.send(data);
        break;
      }
    }
  } catch (e) {
    console.warn(e);
  }
});

sock.send(JSON.stringify({ type: EVENTS.CONNECT, message: "Hello World!" }));
