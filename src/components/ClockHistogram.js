import React from 'react'

import { histogram } from 'd3-array'
import { arc, lineRadial, curveCardinalClosed } from 'd3-shape'

const SECONDS_PER_DAY = 60 * 60 * 24

// Time in seconds of each hour in the day
const THRESHOLDS = new Array(24).fill(0).map((_, i) => i * 60 * 60)

/** Pad a string to the desired length {l} with the padding character */
const pad = (s, l=2, c='0') => s.length < l ? new Array(l - s.length).fill(c).join('') + s : s

/** Convert a timestamp in seconds to an angle; clockwise with midnight at the bottom */
const secondsToAngle = t => 2 * Math.PI * (t / SECONDS_PER_DAY - 0.75)

/** Convert a timestamp in seconds to a printable time */
const secondsToTime = (t, minutes=false) => {
  const hours = t / (60 * 60)
  const suffix = hours < 12 ? 'am' : 'pm'
  if (!minutes) {
    return `${hours % 12 || 12}${suffix}`
  } else {
    const minutes = pad(Math.floor(t / 60 % 60).toString())
    return `${hours % 12 || 12}:${minutes}${suffix}`
  }
}

/** SVG dimensions */
const WIDTH = 200
const HEIGHT = 200

export const ClockHistogram = ({plays}) => {
  const times = plays.map(t => t % SECONDS_PER_DAY)

  const hist = histogram()
    .domain([0, SECONDS_PER_DAY])
    .thresholds(THRESHOLDS)

  const hourly = hist(times)
    .map(l => ({plays: l.length, time: (l.x0 + l.x1) / 2})) 

  const total = hourly.reduce((sum, {plays}) => sum + plays, 0)

  const toRadial = lineRadial()
    .angle(d => secondsToAngle(d.time))
    .radius(d => 12 * 60 * d.plays / total)
    .curve(curveCardinalClosed)

  return (
    <div className="clock-hist">
      <svg width={WIDTH} height={HEIGHT} className="clock">
        <g style={{transform: `translate(${WIDTH/2}px, ${HEIGHT/2}px)`}}>
          <ClockBG />
          <path stroke="#AAD" fill="#EEF" style={{opacity: 0.5}}
            d={toRadial(hourly)}/>
        </g>
      </svg>
    </div>
  )
}

////////////////////////
//// TODO: REFACTOR ALL THESE CONSTANTS DAMN
/// vvvvvvvvvvvvvvvvvvvvvvvvvvv

/** Number of Background ticks and labels to display in the clock */
const N_TICKS = 24
const N_LABELS = 4

/** Calculate times for each clock tick */
const TICKS = new Array(N_TICKS).fill(0)
  .map((_, i) => i * SECONDS_PER_DAY / N_TICKS)
  .map(t => ({t, phi: secondsToAngle(t)}))
  .map(({t, phi}) => ({t, cos: Math.cos(phi), sin: Math.sin(phi)}))

/** Radii for clock ticks */
const RING = 20
const INNER = 35
const OUTER = 45
const PAD = 10

// ^^^^^^^^^^^^^^^^^^^^^^^^^^
///////////////////////////////////////////

/**
 * A Component to draw the background of a clock histogram.
 * This takes no parameters and draws the same regardless of the histogram rendered on top
 */
const ClockBG = () => (
  <g className="clock-bg">
    {TICKS.map(({t, cos, sin}, i) =>
      <g key={`bg-${cos}${sin}`}>
        {(i % (N_TICKS / N_LABELS) === 0) ? (
          <text textAnchor="middle" fontSize={6} fontFamily="courier" stroke="#CCD"
            x={(OUTER + PAD) * cos} y={(INNER + PAD) * sin}>
            {secondsToTime(t)}
          </text>
        ) : (
          <line stroke="#EEE"
            x1={INNER * cos} x2={OUTER * cos}
            y1={INNER * sin} y2={OUTER * sin} />
        )}
      </g>
    )}
    {[RING, 2*RING, 3*RING].map(r => 
      <g key={`ring-${r}`}>
        <path style={{opacity: 0.5}} stroke="#EEE"
          d={arc()({
            innerRadius: r,
            outerRadius: r,
            startAngle: 0,
            endAngle: 2 * Math.PI
          })} />
      </g>
    )}
  </g>
)