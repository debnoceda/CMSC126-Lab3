// Helper function to get unvisited neighbors
const getUnvisitedNeighbors = (node, grid) => {
  const neighbors = [];
  const { row, col } = node;
  
  if (row > 0) neighbors.push(grid[row - 1][col]); // Up
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]); // Down
  if (col > 0) neighbors.push(grid[row][col - 1]); // Left
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]); // Right
  
  return neighbors.filter(neighbor => !neighbor.isVisited && !neighbor.isWall);
};

// Heuristic function (Manhattan distance)
const heuristic = (nodeA, nodeB) => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

// Get all nodes from the grid
const getAllNodes = (grid) => {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

// Get nodes with the lowest f score
const getNodesWithLowestFScore = (openSet, fScore) => {
  let lowestFScore = Infinity;
  let lowestNodes = [];

  for (const node of openSet) {
    const nodeId = `${node.row}-${node.col}`;
    const score = fScore.get(nodeId);
    
    if (score < lowestFScore) {
      lowestFScore = score;
      lowestNodes = [node];
    } else if (score === lowestFScore) {
      lowestNodes.push(node);
    }
  }
  
  return lowestNodes;
};

// Reconstruct the path from the finish node
export const getNodesInShortestPathOrder = (finishNode) => {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};

// The A* algorithm implementation
export const astar = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  const openSet = [startNode];
  const gScore = new Map(); // Cost from start to current node
  const fScore = new Map(); // gScore + heuristic (estimated cost to goal)
  
  // Initialize scores
  for (const row of grid) {
    for (const node of row) {
      const nodeId = `${node.row}-${node.col}`;
      gScore.set(nodeId, Infinity);
      fScore.set(nodeId, Infinity);
    }
  }
  
  const startNodeId = `${startNode.row}-${startNode.col}`;
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(startNode, finishNode));
  
  while (openSet.length > 0) {
    // Get the node with the lowest f score
    const current = getNodesWithLowestFScore(openSet, fScore)[0];
    const currentId = `${current.row}-${current.col}`;
    
    // Mark as visited
    current.isVisited = true;
    visitedNodesInOrder.push(current);
    
    // If we found the finish node, we're done
    if (current === finishNode) {
      return visitedNodesInOrder;
    }
    
    // Remove current from openSet
    openSet.splice(openSet.indexOf(current), 1);
    
    // Check all neighbors
    const neighbors = getUnvisitedNeighbors(current, grid);
    for (const neighbor of neighbors) {
      const neighborId = `${neighbor.row}-${neighbor.col}`;
      
      // Calculate tentative gScore, including the weight of the neighbor
      const tentativeGScore = gScore.get(currentId) + neighbor.weight;
      
      if (tentativeGScore < gScore.get(neighborId)) {
        // This is a better path, record it
        neighbor.previousNode = current;
        gScore.set(neighborId, tentativeGScore);
        fScore.set(neighborId, tentativeGScore + heuristic(neighbor, finishNode));
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  // If we get here, there is no path
  return visitedNodesInOrder;
}; 