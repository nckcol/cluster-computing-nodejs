const zmq = require("zeromq");
const without = require("lodash/without");
const divideGraph = require("./helpers/divide-graph");
const EVENTS = require("./events");
const graph = require("./test-graph.json");

const sock = zmq.socket("router");
sock.bindSync("tcp://127.0.0.1:3000");

console.log("Master started at port 3000");

let workers = [];
let ALL_NUM = 3;
let currentNum = 0;
let workerPromises = {};

sock.on("message", function() {
  const args = Array.from(arguments);
  const identity = args[0];
  const data = Buffer.concat(args.slice(1));
  console.log("DATA: ", data.toString());
  try {
    const action = JSON.parse(data.toString());

    switch (action.type) {
      case EVENTS.CONNECT: {
        currentNum += 1;
        workers.push(identity);
        console.log(
          `Worker connected. Total worker amount: ${currentNum}/${ALL_NUM}`
        );
        const data = JSON.stringify({ hello: null });
        sock.send([identity, data]);

        if (currentNum >= ALL_NUM) {
          main(sock).then(() => {
            console.log("Done!");
          });
        }

        break;
      }

      case EVENTS.RESULT: {
        if (!workerPromises[identity]) {
          return;
        }
        console.log("result", action.payload);
        workerPromises[identity](action.payload);
        break;
      }
    }
  } catch (e) {
    console.warn(e);
  }
});

// sock.send(JSON.stringify({ type: EVENTS.INIT, payload: "Hello" }));

function pushWork(sock) {
  const dividedGraph = divideGraph(graph, 4);

  for (let i = 0; i < 4; i++) {
    const data = JSON.stringify({
      type: EVENTS.INIT,
      payload: {
        subgraph: dividedGraph[i]
      }
    });

    sock.send([workers[i], data]);
  }
}

let timeout = 20;

async function main(sock) {
  pushWork(sock);

  console.log("Pushed");

  let visited = [];
  let valuableEdges = [];
  let selected = [];
  let pool = graph.nodes.map((_, index) => index);
  let current = pool.shift();

  while (pool.length) {
    let minEdge = null;

    const edges = await Promise.all(
      workers.map(worker => requestWork(sock, worker, current))
    );

    console.log(edges);

    for (currentEdge of edges) {
      if (!currentEdge || (minEdge && currentEdge.weight >= minEdge.weight)) {
        continue;
      }

      minEdge = currentEdge;
    }

    if (!minEdge) {
      current = null;
      if (!timeout--) break;
      continue;
    }

    valuableEdges.push(minEdge);
    current = minEdge.target;
    selected.push(current);
    visited[current] = true;
    pool = without(pool, current);

    console.log("==== iter ====", pool);
  }
}

function requestWork(sock, worker, current) {
  return new Promise(async resolve => {
    const data = JSON.stringify({
      type: EVENTS.WORK,
      payload: {
        current
      }
    });

    const promise = new Promise(resolve => {
      workerPromises[worker] = resolve;
    });

    sock.send([worker, data]);

    const currentEdge = await promise;

    resolve(currentEdge);
  });
}

// setInterval(function() {
//   console.log("sending work");
//   sock.send(`some work ${count++}`);
// }, 2000);

// pushWork();
// main();
