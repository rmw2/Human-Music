import React from 'react'

import { area, stack, stackOffsetDiverging, stackOffsetExpand, stackOffsetWiggle, stackOffsetSilhouette } from 'd3-shape'
import { stackOffsetNone } from 'd3-shape/src';

const OFFSET = {
  wiggle: stackOffsetWiggle,
  expand: stackOffsetExpand,
  diverging: stackOffsetDiverging,
  silhouette: stackOffsetSilhouette,
  none: stackOffsetNone
}

export default function StackChart({ x, y, curve, data, color, keys, offset = 'expand', ...rest }) {  
  const stacks = stack().keys(keys).offset(OFFSET[offset])(data)

  const path = area()
    .curve(curve)
    .x(d => x(d.data._date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))

  return (
    <g>
      {stacks.map((series, i) => 
        <path key={keys[i]} d={path(series)} fill={color[i]} stroke="#000" {...rest} />
      )}
    </g>
  )
}