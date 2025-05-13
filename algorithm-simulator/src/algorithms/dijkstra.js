// Node class for pathfinding
export class Node {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.isStart = false;
    this.isFinish = false;
    this.distance = Infinity;
    this.isVisited = false;
    this.isWall = false;
    this.isWeight = false;
    this.weight = 1; // Default weight is 1
    this.previousNode = null;
  }
}

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

// Helper function to sort nodes by distance
const sortNodesByDistance = (unvisitedNodes) => {
  return unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
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

// Trace the shortest path once algorithm is complete
export const getNodesInShortestPathOrder = (finishNode) => {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};

// The actual Dijkstra's algorithm
export const dijkstra = (grid, startNode, finishNode) => {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  
  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    
    // If we encounter a wall, we skip it
    if (closestNode.isWall) continue;
    
    // If the closest node is at a distance of infinity,
    // we must be trapped and should stop
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    // If we reached the finish node, we're done
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    // Update all unvisited neighbors
    const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
    for (const neighbor of unvisitedNeighbors) {
      // Add the weight of the neighbor to the distance
      const distance = closestNode.distance + neighbor.weight;
      
      if (distance < neighbor.distance) {
        neighbor.distance = distance;
        neighbor.previousNode = closestNode;
      }
    }
  }
  
  // If we get here, there is no path
  return visitedNodesInOrder;
}; 