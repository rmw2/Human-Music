import React, { Component } from 'react'

import { Histogram, DensitySeries, withParentSize, XAxis, YAxis } from '@data-ui/histogram'
import { extent, histogram } from 'd3-array'

const ResponsiveHistogram = withParentSize(({parentHeight, parentWidth, ...rest}) =>
  <Histogram width={parentWidth} height={parentHeight} {...rest} />
)

/**
 * @classdesc
 */
export class TimestampHistogram extends Component {
  super(props) {
    constructor(props)
  }

  render() {
    const { all, byArtist } = this.props

    const hist = histogram()

    return (
      <div className="graph">
        <ResponsiveHistogram
          ariaLabel="Artist popularity over time"
          binCount={10}
          normalized={true}>
          <DensitySeries 
            useEntireScale={true}
            rawData={all} 
            stroke={'black'}/>
          <XAxis />
          <YAxis />
        </ResponsiveHistogram>
      </div>
    )
  }
}