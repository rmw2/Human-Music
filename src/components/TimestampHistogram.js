import React, { Component } from 'react'

// Prebuilt scale, axis, and SVG group components
import { scaleTime } from '@vx/scale'

// D3 utilities, for curve interpolation and histogram creation
import { curveMonotoneX } from 'd3-shape'
import { histogram, extent } from 'd3-array'

// Library from generating optimally distinct colors
import distinctColors from 'distinct-colors'

// Autoscaling stacked area chart, supporting several stacking algs
import StackChart from './StackChart'
// Styles for this page/chart
import './hist.css'

// The max number of artists to display
const N_ARTISTS = 30

// The initial number of artists to display
const N_SHOW = 15

// Pre-allocate a color for each artist
const COLORS = distinctColors({
  count: N_ARTISTS, 
  lightMin: 20,
  lightMax: 75,
  chromaMin: 20,
  chromaMax: 40,
})

// Margins for the inner SVG group, holding the histogram
const MARGIN = {
  top: 60,
  bottom: 60,
  left: 30,
  right: 30,
}

/**
 * @classdesc
 * A wrapper for a histogram of song play frequency, subdivided by artist,
 * with controls to include or exclude specific artsts from the 
 */
export class TimestampHistogram extends Component {
  constructor(props) {
    super(props)
    const { all, width, height, byArtist } = props
    
    const { left, right, bottom, top } = MARGIN

    this.xMax = width - (left + right)
    this.yMax = height - (top + bottom)

    // Create histogram scale for all plots
    this.xScale = scaleTime({
      range: [0, this.xMax],
      domain: extent(all, d => new Date(1000*d))
    })

    // Sort and select the top N_ARTISTS for the graph
    this.allArtists = Object.entries(byArtist)
      // Sort by total number of plays
      .sort(([_, a],[__, b]) => b.total - a.total)
      // Select the top n
      .slice(0, N_ARTISTS)

    this.names = this.allArtists.map(([name, _]) => name)

    // Map the top N_ARTISTS to a boolean, indicating whether each should
    // be included in the histogram
    const selected = this.allArtists.reduce((obj, [name, _], i) => ({...obj, [name]: i < N_SHOW}), {})

    this.state = {
      nbins: 40,
      offset: 'wiggle',
      selected
    }

    this.updateBins = this.updateBins.bind(this)
    this.toggleSelected = this.toggleSelected.bind(this)
  }

  componentWillMount() {
    this.updateBins()
  }

  /**
   * @TODO implement rescaling after a window resize
   */
  resize() {}

  /**
   * Update the number of bins being used in the current histograms
   * @param {Number} nbins 
   */
  updateBins(nbins=this.state.nbins) {
    // Create the histogram, mapping an array of dates to a set of nbins bins
    const hist = histogram()
      .domain(this.xScale.domain())
      .thresholds(timeTicks(this.xScale.domain(), nbins))

    // Map to an object of binned plays indexed by artist
    const artists = this.allArtists
      .map(([name, {timestamps}]) => ({[name]: hist(timestamps.map(fromTimestamp))}))
      .reduce((obj, item) => Object.assign(obj, item), {})

    // Reshape from an object of lists to a list of objects
    const bins = hist([])
      .map(({x0, x1}, i) => 
        Object.assign({_date: averageTime(x0, x1)}, Object.entries(artists).reduce((point, [name, b]) => 
          Object.assign(point, {[name]: b[i].length}), {})))

    this.setState({nbins, bins})
  }

  /**
   * Add or remove the given artist from the histogram 
   */
  toggleSelected(artist) {
    const selected  = { ...this.state.selected }
    selected[artist] = !selected[artist]
    this.setState({selected})
  }

  render() {
    const { nbins, offset, bins, selected} = this.state

    // Don't attempt to render an empty graph
    if (!bins) return null

    // List of names of artists to include
    const selectedArtists = this.names.filter(name => selected[name]).reverse()
    // List of corresponding colors, to avoid recoloring every render
    const selectedColors = COLORS.filter((_, i) => selected[this.names[i]]).reverse()

    return (
      <div id="chart-box">
        <ArtistLegend selected={selected} toggle={this.toggleSelected} names={this.names} />
        <div id="chart" className="scroll-wrapper">
          <StackChart
            data={bins}
            keys={selectedArtists}
            curve={curveMonotoneX} 
            color={selectedColors}
            offset={offset}
            margin={MARGIN}
            x={this.xScale} 
            yMax={this.yMax} />
        </div>
        <HistControls 
          updateOffset={type => this.setState({offset: type})}
          updateBins={this.updateBins}
          nbins={nbins}
          offset={offset}/>
      </div>
    )
  }
}

/**
 * 
 * @param   {Object}    props
 * @param   {String[]}  props.names
 * @param   {Boolean[]} props.selected
 * @param   {Function}  props.toggle
 * @returns {React.Component} The interactive legend Legend component
 */
const ArtistLegend = ({names, selected, toggle}) => (
  <div id="legend">
    {names.map((name, i) =>
      <button 
        className="artist ctrl-btn" 
        key={name}
        onClick={() => toggle(name)}
        style={{
          backgroundColor: selected[name] ? COLORS[i] : 'transparent',
          borderColor: COLORS[i],
          color: selected[name] ? 'white' : COLORS[i],
          fontWeight: 'bold'
      }}>{name}</button>
    )}
  </div>
)

/**
 * 
 * @param   {Object}    props
 * @param   {Number}    nbins
 * @param   {Function}  updateBins
 * @param   {Function}  updateOffset
 * @returns {React.Component}
 */
const HistControls = ({nbins, updateBins}) => (
  <div id="controls">
    <div id="granularity">
      <label>Granularity: {nbins}</label>
      <input 
        type="range"
        min="15"
        max="100"
        value={nbins}
        onChange={({target: {value}}) => updateBins(parseInt(value))} />
    </div>
  </div>
)

/******************************************************
 * utility functions
 *****************************************************/

/**
 * Convert a timestamp given in seconds since the unix epoch to a JS Date 
 * @param {Number} t 
 * @returns {Date}
 */
function fromTimestamp(t) {
  return new Date(1000*t)
}

/**
 * 
 * @param   {Date} t0 
 * @param   {Date} t1 
 * @returns {Date}
 */
function averageTime(t0, t1) {
  return new Date((t0.getTime() + t1.getTime()) / 2)
}

/**
 * 
 * @param   {Number[]}  bounds  An array of length two, containing the lo and hi ends of the range 
 * @param   {Number}    n       The number of ticks to be generated
 * @returns {Date[]} an array of Date objects corresponding to n evenly spaced ticks between lo and hi
 */
function timeTicks([lo, hi], n) {
  lo = lo.getTime()
  hi = hi.getTime()
  const step = (hi - lo) / n
  return new Array(n).fill().map((_, i) => new Date(lo + i * step))
}