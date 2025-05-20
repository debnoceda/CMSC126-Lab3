import React, { useState, useEffect, useRef, useCallback } from 'react';
import Node from './Node';
import { dijkstra, getNodesInShortestPathOrder as getDijkstraPath, Node as NodeClass } from '../algorithms/dijkstra';
import { astar, getNodesInShortestPathOrder as getAStarPath } from '../algorithms/astar';
import './PathfindingVisualizer.css';

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [dijkstraGrid, setDijkstraGrid] = useState([]);
  const [astarGrid, setAstarGrid] = useState([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [startNodePos, setStartNodePos] = useState({ row: 4, col: 2 });
  const [finishNodePos, setFinishNodePos] = useState({ row: 4, col: 7 });
  const [isSettingStart, setIsSettingStart] = useState(false);
  const [isSettingFinish, setIsSettingFinish] = useState(false);
  const [isSettingWeight, setIsSettingWeight] = useState(false);
  const [currentNodeType, setCurrentNodeType] = useState('wall'); // 'wall' or 'weight'
  const [visualizationSpeed, setVisualizationSpeed] = useState(50); // Default speed
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 }); // Default 10x10 grid
  const [isRunning, setIsRunning] = useState(false); // Track animation state
  const [weightValue, setWeightValue] = useState(5); // Default weight value
  const [dijkstraStats, setDijkstraStats] = useState({ visitedNodes: 0, pathLength: 0 });
  const [astarStats, setAstarStats] = useState({ visitedNodes: 0, pathLength: 0 });
  const [isLoadingSavedGrid, setIsLoadingSavedGrid] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [gridName, setGridName] = useState('');
  const [savedGrids, setSavedGrids] = useState([]);
  
  const dijkstraGridRef = useRef(null);
  const astarGridRef = useRef(null);
  
  // Move initializeGrid before useEffect and wrap in useCallback
  const initializeGrid = useCallback(() => {
    const newGrid = [];
    for (let row = 0; row < gridSize.rows; row++) {
      const currentRow = [];
      for (let col = 0; col < gridSize.cols; col++) {
        const newNode = new NodeClass(row, col);
        
        // Set start and finish nodes
        if (row === startNodePos.row && col === startNodePos.col) {
          newNode.isStart = true;
        }
        if (row === finishNodePos.row && col === finishNodePos.col) {
          newNode.isFinish = true;
        }
        
        currentRow.push(newNode);
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    
    // Also create copies for each algorithm
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
  }, [gridSize, startNodePos, finishNodePos]);

  // Deep copy a grid to avoid reference issues
  const deepCopyGrid = (originalGrid) => {
    return originalGrid.map(row => 
      row.map(node => ({...node}))
    );
  };

  useEffect(() => {
    // Only initialize grid if we're not loading a saved grid
    if (!isLoadingSavedGrid) {
      initializeGrid();
    }
  }, [gridSize, isLoadingSavedGrid, initializeGrid]);
  
  // Set CSS variables for grid dimensions
  useEffect(() => {
    // Update CSS variables for grid dimensions
    document.documentElement.style.setProperty('--grid-rows', gridSize.rows);
    document.documentElement.style.setProperty('--grid-cols', gridSize.cols);
  }, [gridSize]);

  // Add weight value control to the UI
  const handleWeightValueChange = (e) => {
    const newValue = parseInt(e.target.value);
    setWeightValue(newValue);
  };

  const handleMouseDown = (row, col) => {
    // Prevent interaction during animation
    if (isRunning) return;
    
    const node = grid[row][col];
    
    if (isSettingStart) {
      // Setting a new start node
      if (!node.isFinish && !node.isWall && !node.isWeight) {
        const newGrid = toggleStartNode(grid, row, col);
        setGrid(newGrid);
        setDijkstraGrid(deepCopyGrid(newGrid));
        setAstarGrid(deepCopyGrid(newGrid));
        setStartNodePos({ row, col });
        setIsSettingStart(false);
      }
    } else if (isSettingFinish) {
      // Setting a new finish node
      if (!node.isStart && !node.isWall && !node.isWeight) {
        const newGrid = toggleFinishNode(grid, row, col);
        setGrid(newGrid);
        setDijkstraGrid(deepCopyGrid(newGrid));
        setAstarGrid(deepCopyGrid(newGrid));
        setFinishNodePos({ row, col });
        setIsSettingFinish(false);
      }
    } else if (isSettingWeight) {
      // Setting a weighted node
      if (!node.isStart && !node.isFinish && !node.isWall) {
        const newGrid = getNewGridWithWeightToggled(grid, row, col, weightValue);
        setGrid(newGrid);
        setDijkstraGrid(deepCopyGrid(newGrid));
        setAstarGrid(deepCopyGrid(newGrid));
      }
    } else {
      // Toggle wall or weight based on current mode
      let newGrid;
      if (currentNodeType === 'wall') {
        newGrid = getNewGridWithWallToggled(grid, row, col);
      } else if (currentNodeType === 'weight') {
        newGrid = getNewGridWithWeightToggled(grid, row, col, weightValue);
      }
      
      setGrid(newGrid);
      setDijkstraGrid(deepCopyGrid(newGrid));
      setAstarGrid(deepCopyGrid(newGrid));
      setMouseIsPressed(true);
    }
  };

  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed || isRunning) return;
    
    // Only toggle walls/weights when dragging
    let newGrid;
    if (currentNodeType === 'wall') {
      newGrid = getNewGridWithWallToggled(grid, row, col);
    } else if (currentNodeType === 'weight') {
      newGrid = getNewGridWithWeightToggled(grid, row, col, weightValue);
    }
    
    setGrid(newGrid);
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
  };

  const toggleStartNode = (grid, row, col) => {
    const newGrid = grid.slice();
    // Remove old start node
    const oldStartNode = newGrid[startNodePos.row][startNodePos.col];
    oldStartNode.isStart = false;
    
    // Set new start node
    const node = newGrid[row][col];
    node.isStart = true;
    
    return newGrid;
  };

  const toggleFinishNode = (grid, row, col) => {
    const newGrid = grid.slice();
    // Remove old finish node
    const oldFinishNode = newGrid[finishNodePos.row][finishNodePos.col];
    oldFinishNode.isFinish = false;
    
    // Set new finish node
    const node = newGrid[row][col];
    node.isFinish = true;
    
    return newGrid;
  };

  const getNewGridWithWallToggled = (grid, row, col) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    
    // Don't toggle walls on start, finish, or weight nodes
    if (node.isStart || node.isFinish || node.isWeight) return newGrid;
    
    // Toggle wall
    node.isWall = !node.isWall;
    return newGrid;
  };

  const getNewGridWithWeightToggled = (grid, row, col, weight) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    
    // Don't toggle weights on start, finish, or wall nodes
    if (node.isStart || node.isFinish || node.isWall) return newGrid;
    
    // Toggle weight (if already weighted, remove weight; otherwise add weight)
    node.isWeight = !node.isWeight;
    node.weight = node.isWeight ? weight : 1;
    
    return newGrid;
  };

  const animateAlgorithm = (visitedNodesInOrder, nodesInShortestPathOrder, algorithmType) => {
    const setAlgorithmGrid = algorithmType === 'dijkstra' ? setDijkstraGrid : setAstarGrid;
    const algorithmGrid = algorithmType === 'dijkstra' ? dijkstraGrid : astarGrid;
    
    // Update algorithm stats
    if (algorithmType === 'dijkstra') {
      setDijkstraStats({
        visitedNodes: visitedNodesInOrder.length,
        pathLength: nodesInShortestPathOrder
          .filter(node => !node.isStart && !node.isFinish)
          .reduce((sum, node) => sum + node.weight, 0)
      });
    } else {
      setAstarStats({
        visitedNodes: visitedNodesInOrder.length,
        pathLength: nodesInShortestPathOrder
          .filter(node => !node.isStart && !node.isFinish)
          .reduce((sum, node) => sum + node.weight, 0)
      });
    }
    
    setIsRunning(true);
    
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        // Once we've finished animating visited nodes, animate the shortest path
        setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder, algorithmType);
        }, visualizationSpeed * i);
        return;
      }
      
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        // Don't animate start and finish nodes as visited
        if (!node.isStart && !node.isFinish) {
          // Create a copy of the grid to avoid reference issues
          const newGrid = algorithmGrid.slice();
          // Mark the current node as visited
          newGrid[node.row][node.col] = {...node, isVisited: true};
          setAlgorithmGrid(newGrid);
        }
      }, visualizationSpeed * i);
    }
  };

  const animateShortestPath = (nodesInShortestPathOrder, algorithmType) => {
    const setAlgorithmGrid = algorithmType === 'dijkstra' ? setDijkstraGrid : setAstarGrid;
    const algorithmGrid = algorithmType === 'dijkstra' ? dijkstraGrid : astarGrid;
    
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        // Don't animate start and finish nodes as part of the path
        if (!node.isStart && !node.isFinish) {
          // Create a copy of the grid to avoid reference issues
          const newGrid = algorithmGrid.slice();
          // Mark the current node as part of the path
          newGrid[node.row][node.col] = {...node, isPath: true};
          setAlgorithmGrid(newGrid);
        }
        
        // Once both animations complete, allow interactions again
        if (i === nodesInShortestPathOrder.length - 1 && 
            algorithmType === 'astar') { // Only check on the last algorithm
          setIsRunning(false);
        }
      }, visualizationSpeed * i);
    }
    
    // If there's no path for this algorithm, check if it's the last one to enable interactions
    if (nodesInShortestPathOrder.length === 0 && algorithmType === 'astar') {
      setIsRunning(false);
    }
  };

  const visualizeAlgorithms = () => {
    // Don't start a new visualization if one is already running
    if (isRunning) return;
    
    // Reset both algorithm grids
    setDijkstraGrid(deepCopyGrid(grid));
    setAstarGrid(deepCopyGrid(grid));
    
    // Get start and finish nodes for each algorithm
    const dijkstraStartNode = dijkstraGrid[startNodePos.row][startNodePos.col];
    const dijkstraFinishNode = dijkstraGrid[finishNodePos.row][finishNodePos.col];
    
    const astarStartNode = astarGrid[startNodePos.row][startNodePos.col];
    const astarFinishNode = astarGrid[finishNodePos.row][finishNodePos.col];
    
    // Run Dijkstra's algorithm
    const dijkstraVisitedNodesInOrder = dijkstra(dijkstraGrid, dijkstraStartNode, dijkstraFinishNode);
    const dijkstraNodesInShortestPathOrder = getDijkstraPath(dijkstraFinishNode);
    
    // Run A* algorithm
    const astarVisitedNodesInOrder = astar(astarGrid, astarStartNode, astarFinishNode);
    const astarNodesInShortestPathOrder = getAStarPath(astarFinishNode);
    
    // Animate both algorithms
    animateAlgorithm(dijkstraVisitedNodesInOrder, dijkstraNodesInShortestPathOrder, 'dijkstra');
    animateAlgorithm(astarVisitedNodesInOrder, astarNodesInShortestPathOrder, 'astar');
  };

  const resetGrid = () => {
    // Don't reset during animation
    if (isRunning) return;
    
    // Reset stats
    setDijkstraStats({ visitedNodes: 0, pathLength: 0 });
    setAstarStats({ visitedNodes: 0, pathLength: 0 });
    
    initializeGrid();
  };

  const clearWalls = () => {
    // Don't clear during animation
    if (isRunning) return;
    
    // Reset the grid with no walls and weights
    const newGrid = grid.map(row => 
      row.map(node => {
        const newNode = {...node};
        newNode.isWall = false;
        newNode.isWeight = false;
        newNode.weight = 1;
        newNode.isVisited = false;
        newNode.isPath = false;
        return newNode;
      })
    );
    
    setGrid(newGrid);
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
  };

  const updateGridSize = (rows, cols) => {
    // Don't update during animation
    if (isRunning) return;
    
    // Ensure start and finish positions are valid for new grid size
    const newStartPos = {
      row: Math.min(startNodePos.row, rows - 1),
      col: Math.min(startNodePos.col, cols - 1)
    };
    const newFinishPos = {
      row: Math.min(finishNodePos.row, rows - 1),
      col: Math.min(finishNodePos.col, cols - 1)
    };
    
    // Update state with new grid size and node positions
    setGridSize({ rows, cols });
    setStartNodePos(newStartPos);
    setFinishNodePos(newFinishPos);
  };

  // Generate a random maze
  const generateRandomMaze = () => {
    // Don't generate during animation
    if (isRunning) return;
    
    // Create a new grid preserving weights
    const newGrid = grid.map(row => 
      row.map(node => {
        const newNode = {...node};
        // Preserve weight nodes but clear walls
        newNode.isWall = false;
        // Clear visited and path states
        newNode.isVisited = false;
        newNode.isPath = false;
        return newNode;
      })
    );
    
    // Add random walls
    const wallDensity = 0.25; // Adjust to control density of walls
    
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[0].length; col++) {
        const node = newGrid[row][col];
        
        // Don't place walls on start, finish, or weighted nodes
        if (node.isStart || node.isFinish || node.isWeight) continue;
        
        // Randomly place walls based on density
        if (Math.random() < wallDensity) {
          node.isWall = true;
        }
      }
    }
    
    setGrid(newGrid);
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
    
    // Reset stats
    setDijkstraStats({ visitedNodes: 0, pathLength: 0 });
    setAstarStats({ visitedNodes: 0, pathLength: 0 });
  };

  // Generate a weighted maze
  const generateWeightedMaze = () => {
    // Don't generate during animation
    if (isRunning) return;
    
    // Create a new grid preserving walls
    const newGrid = grid.map(row => 
      row.map(node => {
        const newNode = {...node};
        // Preserve wall nodes but clear weights
        newNode.isWeight = false;
        newNode.weight = 1;
        // Clear visited and path states
        newNode.isVisited = false;
        newNode.isPath = false;
        return newNode;
      })
    );
    
    // Add random weights
    const weightDensity = 0.2; // Adjust to control density of weights
    
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[0].length; col++) {
        const node = newGrid[row][col];
        
        // Don't place weights on start, finish, or wall nodes
        if (node.isStart || node.isFinish || node.isWall) continue;
        
        // Randomly place weights based on density
        if (Math.random() < weightDensity) {
          node.isWeight = true;
          // Random weight between 2 and 10
          node.weight = Math.floor(Math.random() * 9) + 2;
        }
      }
    }
    
    setGrid(newGrid);
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
    
    // Reset stats
    setDijkstraStats({ visitedNodes: 0, pathLength: 0 });
    setAstarStats({ visitedNodes: 0, pathLength: 0 });
  };

  // Set random start and finish positions
  const setRandomStartFinish = () => {
    // Don't set during animation
    if (isRunning) return;
    
    const { rows, cols } = gridSize;
    
    // Generate random positions
    let newStartRow = Math.floor(Math.random() * rows);
    let newStartCol = Math.floor(Math.random() * cols);
    let newFinishRow = Math.floor(Math.random() * rows);
    let newFinishCol = Math.floor(Math.random() * cols);
    
    // Ensure start and finish are not in the same position
    while (newStartRow === newFinishRow && newStartCol === newFinishCol) {
      newFinishRow = Math.floor(Math.random() * rows);
      newFinishCol = Math.floor(Math.random() * cols);
    }
    
    // Update grid with new start and finish positions
    const newGrid = grid.map(row => 
      row.map(node => {
        const newNode = {...node};
        // Reset previous start and finish
        newNode.isStart = false;
        newNode.isFinish = false;
        
        // Set new start and finish
        if (newNode.row === newStartRow && newNode.col === newStartCol) {
          newNode.isStart = true;
          // Clear any walls or weights
          newNode.isWall = false;
          newNode.isWeight = false;
          newNode.weight = 1;
        }
        if (newNode.row === newFinishRow && newNode.col === newFinishCol) {
          newNode.isFinish = true;
          // Clear any walls or weights
          newNode.isWall = false;
          newNode.isWeight = false;
          newNode.weight = 1;
        }
        
        return newNode;
      })
    );
    
    // Update state
    setStartNodePos({ row: newStartRow, col: newStartCol });
    setFinishNodePos({ row: newFinishRow, col: newFinishCol });
    setGrid(newGrid);
    setDijkstraGrid(deepCopyGrid(newGrid));
    setAstarGrid(deepCopyGrid(newGrid));
  };

  // Store grid in local storage
  const saveGrid = () => {
    if (isRunning) return;
    setShowSaveModal(true);
  };

  const handleSaveGrid = () => {
    if (!gridName.trim()) {
      alert('Please enter a name for the grid');
      return;
    }

    try {
      const gridState = {
        name: gridName.trim(),
        walls: [],
        weights: [],
        startNodePos,
        finishNodePos,
        gridSize,
        timestamp: new Date().toISOString()
      };
      
      // Save wall and weight positions
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
          const node = grid[row][col];
          if (node.isWall) {
            gridState.walls.push({ row, col });
          }
          if (node.isWeight) {
            gridState.weights.push({ row, col, weight: node.weight });
          }
        }
      }
      
      // Get existing saved grids
      const currentSavedGrids = JSON.parse(localStorage.getItem('savedGrids') || '[]');
      
      // Add new grid to saved grids
      currentSavedGrids.push(gridState);
      
      // Keep only the last 5 saved grids
      const recentGrids = currentSavedGrids.slice(-5);
      
      // Save to localStorage
      localStorage.setItem('savedGrids', JSON.stringify(recentGrids));
      setSavedGrids(recentGrids);
      setShowSaveModal(false);
      setGridName('');
      
      // Log the saved state for debugging
      console.log('Saved grid state:', gridState);
    } catch (error) {
      console.error('Error saving grid:', error);
      alert('Failed to save grid. Please try again.');
    }
  };

  // Load grid from local storage
  const loadGrid = () => {
    if (isRunning) return;
    
    try {
      // Get saved grids
      const currentSavedGrids = JSON.parse(localStorage.getItem('savedGrids') || '[]');
      setSavedGrids(currentSavedGrids);
      
      if (currentSavedGrids.length === 0) {
        alert('No saved grids found!');
        return;
      }
      
      setShowLoadModal(true);
    } catch (error) {
      console.error('Error loading grid:', error);
      alert('Failed to load grid. Please try again.');
    }
  };

  const handleLoadGrid = (gridState) => {
    try {
      // Set loading flag
      setIsLoadingSavedGrid(true);
      
      // Log the loaded state for debugging
      console.log('Loading grid state:', gridState);
      
      // Create new grid with saved state
      const newGrid = [];
      for (let row = 0; row < gridState.gridSize.rows; row++) {
        const currentRow = [];
        for (let col = 0; col < gridState.gridSize.cols; col++) {
          const newNode = new NodeClass(row, col);
          
          // Set start and finish nodes
          if (row === gridState.startNodePos.row && col === gridState.startNodePos.col) {
            newNode.isStart = true;
          }
          if (row === gridState.finishNodePos.row && col === gridState.finishNodePos.col) {
            newNode.isFinish = true;
          }
          
          // Set walls
          const isWall = gridState.walls.some(wall => wall.row === row && wall.col === col);
          if (isWall) {
            newNode.isWall = true;
          }
          
          // Set weights
          const weightNode = gridState.weights.find(weight => weight.row === row && weight.col === col);
          if (weightNode) {
            newNode.isWeight = true;
            newNode.weight = weightNode.weight;
          }
          
          currentRow.push(newNode);
        }
        newGrid.push(currentRow);
      }
      
      // First update grid size and positions
      setGridSize(gridState.gridSize);
      setStartNodePos(gridState.startNodePos);
      setFinishNodePos(gridState.finishNodePos);
      
      // Then update the grids
      setGrid(newGrid);
      
      // Create deep copies for algorithm grids
      const dijkstraGridCopy = deepCopyGrid(newGrid);
      const astarGridCopy = deepCopyGrid(newGrid);
      
      // Update algorithm grids
      setDijkstraGrid(dijkstraGridCopy);
      setAstarGrid(astarGridCopy);
      
      // Reset stats
      setDijkstraStats({ visitedNodes: 0, pathLength: 0 });
      setAstarStats({ visitedNodes: 0, pathLength: 0 });
      
      // Force a re-render by updating a dummy state
      setCurrentNodeType(prev => prev === 'wall' ? 'weight' : 'wall');
      
      // Reset loading flag after a short delay
      setTimeout(() => {
        setIsLoadingSavedGrid(false);
        // Force another re-render after loading is complete
        setCurrentNodeType(prev => prev === 'wall' ? 'weight' : 'wall');
      }, 100);
      
      setShowLoadModal(false);
      
      // Log the loaded grid for debugging
      console.log('Loaded grid:', newGrid);
      console.log('Walls:', gridState.walls);
      console.log('Weights:', gridState.weights);
    } catch (error) {
      console.error('Error loading grid:', error);
      alert('Failed to load grid. Please try again.');
      setIsLoadingSavedGrid(false);
    }
  };

  return (
    <div className="pathfinding-visualizer">
      <div className="sidebar">
        <h1>
          <img src={require('../assets/logo-export.png')} alt="Pathfinding Visualizer" />
        </h1>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h2>Algorithms</h2>
            <div className="controls">
              <button onClick={visualizeAlgorithms} disabled={isRunning}>Find Path</button>
              <button onClick={resetGrid} disabled={isRunning}>Reset</button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h2>Grid Setup</h2>
            <div className="controls">
              <button onClick={() => setIsSettingStart(true)} disabled={isRunning}>Set Start Node</button>
              <button onClick={() => setIsSettingFinish(true)} disabled={isRunning}>Set End Node</button>
              <button onClick={setRandomStartFinish} disabled={isRunning}>Random Start/End</button>
              
              <div className="size-control">
                <label>Grid Size:</label>
                <select 
                  value={`${gridSize.rows}x${gridSize.cols}`} 
                  onChange={(e) => {
                    const [rows, cols] = e.target.value.split('x').map(Number);
                    updateGridSize(rows, cols);
                  }}
                  disabled={isRunning}
                >
                  <option value="10x10">10x10</option>
                  <option value="15x15">15x15</option>
                  <option value="20x20">20x20</option>
                  <option value="25x25">25x25</option>
                  <option value="30x30">30x30</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h2>Node Types</h2>
            <div className="controls">
              <button 
                onClick={() => {
                  setCurrentNodeType('wall');
                  setIsSettingWeight(false);
                }} 
                disabled={isRunning}
              >
                Draw Walls
              </button>
              <button 
                onClick={() => {
                  setCurrentNodeType('weight');
                  setIsSettingWeight(true);
                }} 
                disabled={isRunning}
                style={{backgroundColor: currentNodeType === 'weight' ? '#2E7D32' : ''}}
              >
                Draw Weights
              </button>
              {currentNodeType === 'weight' && (
                <div className="weight-control">
                  <label>Weight Value:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={weightValue}
                    onChange={handleWeightValueChange}
                    disabled={isRunning}
                  />
                </div>
              )}
              <button onClick={clearWalls} disabled={isRunning}>Clear Walls & Weights</button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h2>Maze Generation</h2>
            <div className="controls">
              <button onClick={generateRandomMaze} disabled={isRunning}>Generate Random Maze</button>
              <button onClick={generateWeightedMaze} disabled={isRunning}>Generate Weighted Maze</button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h2>Animation Speed</h2>
            <div className="controls">
              <div className="speed-control">
                <label>Speed:</label>
                <select 
                  value={visualizationSpeed} 
                  onChange={(e) => setVisualizationSpeed(parseInt(e.target.value))}
                  disabled={isRunning}
                >
                  <option value="10">Fast</option>
                  <option value="50">Medium</option>
                  <option value="100">Slow</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h2>Save & Load</h2>
            <div className="controls">
              <button onClick={saveGrid} disabled={isRunning}>Save Grid</button>
              <button onClick={loadGrid} disabled={isRunning}>Load Grid</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="grid-container">
          <div className="algorithm-grid">
            <div className="algorithm-title">Dijkstra's Algorithm</div>
            <div className="grid" ref={dijkstraGridRef}>
              {dijkstraGrid.map((row, rowIdx) => {
                return (
                  <div key={rowIdx} className="row">
                    {row.map((node, nodeIdx) => {
                      const { row, col, isStart, isFinish, isWall, isWeight, isVisited, isPath, weight } = node;
                      return (
                        <Node
                          key={nodeIdx}
                          row={row}
                          col={col}
                          isStart={isStart}
                          isFinish={isFinish}
                          isWall={isWall}
                          isWeight={isWeight}
                          isVisited={isVisited}
                          isPath={isPath}
                          weight={weight}
                          onMouseDown={(r, c) => handleMouseDown(r, c)}
                          onMouseEnter={(r, c) => handleMouseEnter(r, c)}
                          onMouseUp={() => handleMouseUp()}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="algorithm-stats">
              <span>Nodes Visited: {dijkstraStats.visitedNodes}</span>
              <span>Path Length: {dijkstraStats.pathLength}</span>
            </div>
          </div>
          
          <div className="algorithm-grid">
            <div className="algorithm-title">A* Search Algorithm</div>
            <div className="grid" ref={astarGridRef}>
              {astarGrid.map((row, rowIdx) => {
                return (
                  <div key={rowIdx} className="row">
                    {row.map((node, nodeIdx) => {
                      const { row, col, isStart, isFinish, isWall, isWeight, isVisited, isPath, weight } = node;
                      return (
                        <Node
                          key={nodeIdx}
                          row={row}
                          col={col}
                          isStart={isStart}
                          isFinish={isFinish}
                          isWall={isWall}
                          isWeight={isWeight}
                          isVisited={isVisited}
                          isPath={isPath}
                          weight={weight}
                          onMouseDown={(r, c) => handleMouseDown(r, c)}
                          onMouseEnter={(r, c) => handleMouseEnter(r, c)}
                          onMouseUp={() => handleMouseUp()}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="algorithm-stats">
              <span>Nodes Visited: {astarStats.visitedNodes}</span>
              <span>Path Length: {astarStats.pathLength}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Grid Modal */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Save Grid</h2>
            <div className="modal-content">
              <input
                type="text"
                placeholder="Enter grid name"
                value={gridName}
                onChange={(e) => setGridName(e.target.value)}
                className="modal-input"
              />
              <div className="modal-buttons">
                <button onClick={handleSaveGrid} className="modal-button save">Save</button>
                <button onClick={() => {
                  setShowSaveModal(false);
                  setGridName('');
                }} className="modal-button cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Grid Modal */}
      {showLoadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Load Grid</h2>
            <div className="modal-content">
              <div className="grid-list">
                {savedGrids.map((grid, index) => (
                  <div key={index} className="grid-item" onClick={() => handleLoadGrid(grid)}>
                    <span className="grid-name">{grid.name}</span>
                    <span className="grid-date">{new Date(grid.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button onClick={() => setShowLoadModal(false)} className="modal-button cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathfindingVisualizer; 