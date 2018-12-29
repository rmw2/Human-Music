import React, { Component } from 'react'
import { TimestampHistogram } from './components/TimestampHistogram'

import { artists, all } from './data/stamps.json'

import './app.css'
class App extends Component {
  render() {
    return (
      <div id="app">
        <TimestampHistogram 
          all={all} 
          byArtist={artists} 
          height={600}
          width={2000} />
      </div>
    )
  }
}

export default App
