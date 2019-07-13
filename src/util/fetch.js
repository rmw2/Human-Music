import axios from 'axios'

const BASE = `http://musicbrainz.org/ws/2`

export function getArtistInfo(msid) {
  const URL = `${BASE}/artist/${msid}?inc=tags&fmt=json`

  
}