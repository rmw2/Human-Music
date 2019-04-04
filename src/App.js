import React, { Component } from 'react'
import { TimestampHistogram } from './components/TimestampHistogram'
import { ClockHistogram } from './components/ClockHistogram'

import { artists, all } from './data/stamps.json'

import './app.css'

class App extends Component {
  render() {
    return (
      <div id="app">
        <TimestampHistogram 
          all={all} 
          byArtist={artists} 
          height={750}
          width={2000} />
        <ClockHistogram 
          plays={all} />
      </div>
    )
  }
}

export default App


/*
plans:
PAGES:

landing page:
- histogram component by artist (or by genre ?)
- clock histogram: all plays by defualt, restrict to time bin on mouseover

pages for individual artists
- divide histogram by song and album (hist by song, color coordinate by album)
- annotate histogram with album release dates
- list view for album/song plays and release info (date, label, EP/LP/Single)

pages for genre tags
- similar division of histogram by artist within a genre tag
- top artist/song/release w/i genre


COMPONENTS:
plays over time
  - optional annotations
  - change histogram style: normalized, wiggle, silhouette, staked areas, individual (w/opacity)
  - toggle display for individual bars
  - mouseover for data (time range, plays per artist etc.)
clock histogram
  - mouseover for data
*/