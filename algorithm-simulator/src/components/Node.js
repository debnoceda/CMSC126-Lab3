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
  onMouseDown,
  onMouseEnter,
  onMouseUp
}) => {
  const extraClassName = isStart
    ? 'node-start'
    : isFinish
    ? 'node-finish'
    : isWall
    ? 'node-wall'
    : isWeight
    ? 'node-weight'
    : isPath
    ? 'node-shortest-path'
    : isVisited
    ? 'node-visited'
    : '';

  return (
    <div
      id={`node-${row}-${col}`}
      className={`node ${extraClassName}`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
    />
  );
};

export default Node; 