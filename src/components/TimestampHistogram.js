import React, { Component } from 'react'

import { AxisLeft, AxisBottom } from '@vx/axis'
import { scaleTime, scaleLinear } from '@vx/scale'
import { Group } from '@vx/group'

import { curveMonotoneX } from 'd3-shape'
import { histogram, extent, max } from 'd3-array'
import distinctColors from 'distinct-colors'

import StackChart from './StackChart'

import './hist.css'

// The max number of artists to display
const N_ARTISTS = 30

// The initial number of artists to display
const N_SHOW = 15

// Pre-allocate a color for each artist
const COLORS = distinctColors({
  count: N_ARTISTS, 
  lightMin: 60,
  lightMax: 95,
  chromaMin: 20,
  chromaMax: 40,
})

/**
 * @classdesc
 */
export class TimestampHistogram extends Component {
  constructor(props) {
    super(props)
    const { all, width, height, byArtist } = props
    
    this.margin = {
      top: 60,
      bottom: 60,
      left: 80,
      right: 80,
    }

    this.xMax = width - (this.margin.left + this.margin.right)
    this.yMax = height - (this.margin.top + this.margin.bottom)

    // Create histogram scale for all plots
    this.xScale = scaleTime({
      range: [0, this.xMax],
      domain: extent(all, d => new Date(1000*d))
    })

    this.yScale = scaleLinear({
      range: [this.yMax, 0],
      domain: [0, 1]
    })


    // Sort and select the top N_ARTISTS for the graph
    this.allArtists = Object.entries(byArtist)
      // Sort by total number of plays
      .sort(([_, a],[$, b]) => a.total - b.total)
      // Select the top n
      .slice(-1*N_ARTISTS)
      .reverse()

    this.names = this.allArtists.map(([name, _]) => name)

    // Map the top N_ARTISTS to a boolean, indicating whether each should
    // be included in the histogram
    const selected = this.allArtists.reduce((obj, [name, _], i) => ({...obj, [name]: i < N_SHOW}), {})

    this.state = {
      nBins: 40,
      offset: 'expand',
      selected
    }
  }

  componentWillMount() {
    this.updateBins()
  }

  updateBins({nBins}=this.state) {
    // Create the histogram, mapping an array of dates to a set of nBins bins
    const hist = histogram()
      .domain(this.xScale.domain())
      .thresholds(timeTicks(this.xScale.domain(), nBins))

    console.log(timeTicks(this.xScale.domain(), nBins))

    // Map to an object of binned plays indexed by artist
    const artists = this.allArtists
      .map(([name, {timestamps}]) => ({[name]: hist(timestamps.map(fromTimestamp))}))
      .reduce((obj, item) => Object.assign(obj, item), {})

    // Reshape from an object of lists to a list of objects
    const bins = hist([])
      .map(({x0, x1}, i) => 
        Object.assign({_date: averageTime(x0, x1)}, Object.entries(artists).reduce((point, [name, b]) => 
          Object.assign(point, {[name]: b[i].length}), {})))

    this.setState({nBins, bins})
  }

  toggleSelected(artist) {
    const selected  = { ...this.state.selected }
    selected[artist] = !selected[artist]
    this.setState({selected})
  }

  render() {
    const { width, height } = this.props
    const { nBins, offset, bins, selected} = this.state

    // List of names of artists to include
    const selectedArtists = this.names.filter(name => selected[name]).reverse()
    // List of corresponding colors, to avoid recoloring every render
    const selectedColors = COLORS.filter((_, i) => selected[this.names[i]]).reverse()

    if (!bins) return null

    return (
      <div id="graph-box">
        <div id="chart-main">
          <div id="legend">
            {this.names.map((name, i) =>
              <button 
                className="artist ctrl-btn" 
                key={name}
                onClick={() => this.toggleSelected(name)}
                style={{
                  backgroundColor: selected[name] ? COLORS[i] : 'transparent',
                  borderColor: COLORS[i],
                  color: selected[name] ? 'white' : COLORS[i],
                  fontWeight: 'bold'
              }}>{name}</button>
            )}
          </div>
          <div id="chart" className="scroll-wrapper">
            <svg width={width} height={height}>
              <Group top={this.margin.top} left={this.margin.left}>
                {/*<AxisLeft
                  label="Frequency" 
                  scale={this.yScale}
                  top={0} 
                  left={0} />*/}
                <AxisBottom
                  label="Time"
                  scale={this.xScale}
                  top={this.yMax} />
                <StackChart
                  offset="zero"
                  data={bins}
                  keys={selectedArtists}
                  curve={curveMonotoneX} 
                  color={selectedColors}
                  offset={offset}
                  x={this.xScale} 
                  y={this.yScale} />
              </Group>
            </svg>
          </div>
        </div>
        <div className="controls">
          <input 
            type="range"
            min="15"
            max="100"
            value={nBins}
            onChange={({target: {value}}) => this.updateBins({nBins: parseInt(value)})} />
          <div>
            {['none', 'silhouette', 'wiggle', 'expand'].map(type => 
              <button 
                className={type === offset ? 'ctrl-btn selected' : 'ctrl-btn'} 
                onClick={() => this.setState({offset: type})}>
                {type}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

function fromTimestamp(t) {
  return new Date(1000*t)
}

function averageTime(t0, t1) {
  return new Date((t0.getTime() + t1.getTime()) / 2)
}

function timeTicks([lo, hi], n) {
  lo = lo.getTime()
  hi = hi.getTime()
  const step = (hi - lo) / n
  return new Array(n).fill().map((_, i) => new Date(lo + i * step))
}