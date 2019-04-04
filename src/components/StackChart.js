import React, { Component } from 'react'
import { scaleLinear } from '@vx/scale'
import Snap from 'snapsvg'
import { 
  area, 
  stack, 
  stackOffsetDiverging, 
  stackOffsetExpand, 
  stackOffsetWiggle, 
  stackOffsetSilhouette, 
  stackOffsetNone 
} from 'd3-shape'

import './draw.css'
console.log('Snap:', Snap)
const mina = {}

/**
 * @module StackChart
 * This module defines a chart component which combines a set of line plots in any of several different ways,
 * animating transitions between them.  In particular, lines may be shown stacked with any of the below offset
 * and baseline options, provided by d3.  In addition, the individual line plots may be displayed over each other
 * without stacking, by varying the opacity instead.
 */

const OFFSET = {
  wiggle: stackOffsetWiggle,
  expand: stackOffsetExpand,
  diverging: stackOffsetDiverging,
  silhouette: stackOffsetSilhouette,
  none: stackOffsetNone
}

export default class StackChart extends Component {
  render() {
    const {x, yMax, color, keys, curve, data, offset = 'expand', ...rest} = this.props
    const stacks = stack().keys(keys).offset(OFFSET[offset])(data)
    const N = stacks.length - 1

    // Calculate the full extent of y's domain to scale the chart to fit
    // Use the fact that the stacks are already sorted to save computation
    const lo = stacks[0].reduce((lo, [next, _]) => next < lo ? next : lo, 0)
    const hi = stacks[N].reduce((hi, [_, next]) => next > hi ? next : hi, 1)

    const y = scaleLinear({
      range: [yMax, 0],
      domain: [lo, hi]
    })

    const path = area()
      .curve(curve)
      .x(d => x(d.data._date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))

    return (
      <g>
        {stacks.map((series, i) => 
          <MorphPath 
            key={keys[i]} 
            d={path(series)} 
            fill={color[i]} 
            stroke="#fff" 
            {...rest} />
        )}
      </g>
    ) 
  }
}

/**
 * @classdesc
 * A utility component for managing animated transitions between svg paths.
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

    $el.animate({d: curr}, 500, mina.easein, 
      () => this.setState({ prev: curr }))
  }

  /**
   * Compare new props with existing state to determine if the component should
   * update or if any state should be changed.
   * 
   * TODO: figure out if this is where this should happen
   */
  componentWillReceiveProps() {

  }

  render() {
    const { curr, prev } = this.state
    const { d, ...rest } = this.props

    console.log('CURR', curr)
    console.log('PREV', prev)

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

// export default class StackChart extends Component {
//   state = {
//     data: null,
//     previousCurves: null,
//     currentCurves: null
//   }

//   /**
//    * Set up the endpoints for the transition
//    */
//   componentWillReceiveProps() {
//     const stacks = stack().keys(keys).offset(OFFSET[offset])(data)
//     const N = stacks.length - 1

//     // Calculate the full extent of y's domain to scale the chart to fit
//     // Use the fact that the stacks are already sorted to save computation
//     const lo = stacks[0].reduce((lo, [next, _]) => next < lo ? next : lo, 0)
//     const hi = stacks[N].reduce((hi, [_, next]) => next > hi ? next : hi, 1)

//     const y = scaleLinear({
//       range: [yMax, 0],
//       domain: [lo, hi]
//     })

//     const path = area()
//       .curve(curve)
//       .x(d => x(d.data._date))
//       .y0(d => y(d[0]))
//       .y1(d => y(d[1]))

//     // Pregenerate from and to
//     if (data !== this.state.data) {
//       this.setState({
//         data,
//         currentCurves: stacks.map((series, i) => 
//           <path key={keys[i]} d={path(series)} fill={color[i]} stroke="#fff" {...rest} />),
//         previousCurves: this.state.currentCurves,
//       })
//     }
//   }

//   updateData() {

//   }

//   updateCurve({x, y, curve}) {
    
//   }

//   render() {
//     const { previousCurves, currentCurves } = this.state

//     return  (
//       <g>
//         {previousCurves ? currentCurves.map((_, i) => 
//           <Motion style={{t: spring(10)}}>
//             {({t}) =>
//               <MorphTransition progress={t} rotation="none">
//                 {{from: previousCurves[i], to: currentCurves[i]}}
//               </MorphTransition>
//             }
//           </Motion>
//         ) : currentCurves}
//       </g>
//     )
//   }
// }