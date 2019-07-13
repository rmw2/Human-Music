import React, { Component } from 'react'

// Prebuilt scale, axis, and SVG group components
import { Group } from '@vx/group'
import { AxisBottom } from '@vx/axis'
import { scaleLinear, scaleTime } from '@vx/scale'

import Snap from 'snapsvg'
import { 
  area, 
  stack, 
  stackOffsetExpand, 
  stackOffsetWiggle, 
  stackOffsetSilhouette, 
  stackOffsetNone 
} from 'd3-shape'

import ResponsiveSVG from './ResponsiveSVG'
import './StackChart.css'

/**
 * @module StackChart
 * This module defines a chart component which combines a set of line plots in any of several different ways,
 * animating transitions between them.  In particular, lines may be shown stacked with any of the below offset
 * and baseline options, provided by d3.  In addition, the individual line plots may be displayed over each other
 * without stacking, by varying the opacity instead.
 */

const OFFSET = {
  stack: stackOffsetNone,
  normalize: stackOffsetExpand,
  stream: stackOffsetWiggle,
  silhouette: stackOffsetSilhouette,
  overlap: null
}

// Margins for the inner SVG group, holding the stack
const MARGIN = {
  top: 5,
  bottom: 5,
  left: 5,
  right: 5,
}

export default class StackChart extends Component {
  state = {
    offset: 'stream'
  }

  render() {
    const { domain, color, keys, curve, data, ...rest } = this.props
    const { offset, height, width } = this.state

    const stacks = stack().keys(keys).offset(OFFSET[offset])(data)
    const N = stacks.length - 1

    // Calculate the full extent of y's domain to scale the chart to fit
    // Use the fact that the stacks are already sorted to save computation
    const lo = stacks[0].reduce((lo, [next, _]) => next < lo ? next : lo, 0)
    const hi = stacks[N].reduce((hi, [_, next]) => next > hi ? next : hi, 1)

    const { left, right, bottom, top } = MARGIN

    const xMax = width - (left + right)
    const yMax = height - (top + bottom)

    const x = scaleTime({
      domain,
      range: [0, xMax],
    })

    const y = scaleLinear({
      domain: [lo, hi],
      range: [yMax, 0],
    })

    const path = area()
      .curve(curve)
      .x(d => x(d.data._date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))

    return (
      <div id="stackchart">
        <StackControls updateOffset={offset => this.setState({offset})} />
        <div id="stackchart-wrapper">
          <ResponsiveSVG onUpdate={(width, height) => this.setState({width, height})}>
            <Group>
              {/*<AxisLeft
                label="Frequency" 
                scale={this.yScale}
                top={0} 
                left={0} />*/}
              {stacks.map((series, i) => 
                <MorphPath 
                  key={keys[i]} 
                  d={path(series)} 
                  fill={color[i]} 
                  {...rest} />
              )}
              <AxisBottom
                label="Time"
                scale={x}
                top={yMax} />
            </Group>
          </ResponsiveSVG>
        </div>
      </div>
    ) 
  }
}

/**
 * A set of buttons to control the offset mode of the 
 * @param {Object} props 
 */
const StackControls = ({updateOffset, offset}) => (
  <div id="stackchart-controls">
    {Object.keys(OFFSET).map(type => 
      <button 
        key={type}
        className={type === offset ? 'ctrl-btn selected' : 'ctrl-btn'} 
        onClick={() => updateOffset(type)}>
        {type}
      </button>
    )}
  </div>
)

/**
 * @classdesc
 * A utility component for managing animated transitions between svg paths.
 * Each MorphPath wraps a single <path> element, animating three a
 */
class MorphPath extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      curr: props.d, 
      prev: null 
    }

    this.morph = this.morph.bind(this)
  }

  /**
   * Perform the actual SVG morph animation using SnapSVG
   */
  morph(path) {
    const { curr } = this.state
    const $el = Snap(path)

    $el.animate({d: curr}, 250, null, 
      () => this.setState({ prev: curr }))
  }

  /**
   * Compare new path with existing curr to determine if a transition animation should
   * be fired; i.e. if the new `d` is distinct from `curr`.
   */
  componentWillReceiveProps({d}) {
    const { curr } = this.state
    if (d !== curr) {
      this.setState({
        prev: curr,
        curr: d
      })
    }
  }

  render() {
    const { curr, prev } = this.state
    const { d, ...rest } = this.props

    if (!prev) {
      // Draw the path for the first time, incrementally using {path}
      return (
        <path className="path-draw" d={curr} {...rest} />
      )
    } else if (prev !== curr) {
      // Continuously morph the path from the previous path defined in {prev}
      return (
        <path ref={this.morph} className="path-morph" d={prev} {...rest} />
      )
    } else {
      // Simply display the current path with no animation or funny business
      return (
        <path className="path-stable" d={curr} {...rest} />
      )
    }
  }
}