import React, { Component } from 'react'

// Create the histogram, mapping an array of dates to a set of nbins bins
const hist = histogram()
  .domain(this.xScale.domain())
  .thresholds(timeTicks(this.xScale.domain(), nbins))

function histifiy(hist, data) {
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