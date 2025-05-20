import React from 'react';
import './Node.css';

const Node = ({
  row,
  col,
  isStart,
  isFinish,
  isWall,
  isWeight,
  isVisited,
  isPath,
  weight,
  onMouseDown,
  onMouseEnter,
  onMouseUp
}) => {
  const groundImage = require('../assets/ground-export.png');
  const wallImage = require('../assets/walls/ruin_pillar_broke-export.png');
  const weightImage = require('../assets/weights/weight2.png');
  
  const extraClassNames = [];
  
  if (isStart) extraClassNames.push('node-start');
  if (isFinish) extraClassNames.push('node-finish');
  if (isWall) extraClassNames.push('node-wall');
  if (isWeight) extraClassNames.push('node-weight');
  if (isPath) extraClassNames.push('node-shortest-path');
  if (isVisited) extraClassNames.push('node-visited');

  return (
    <div
      id={`node-${row}-${col}`}
      className={`node ${extraClassNames.join(' ')}`}
      style={{ 
        '--ground-bg': `url(${groundImage})`,
        '--wall-bg': isWall ? `url(${wallImage})` : 'none',
        '--weight-bg': isWeight ? `url(${weightImage})` : 'none'
      }}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
    >
      {isWeight && <span className="weight-value">{weight}</span>}
    </div>
  );
};

export default Node; 