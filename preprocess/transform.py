import json


def replace_spaces(phrase, char='_'):
  return char.join(phrase.split(' '))

def to_artist_list(data):
  """ Expect a list of MusicBrainz plays and return a list of artist names.
  """
  artists = []

  for item in data: 
    artists.append(replace_spaces(item['artist_name']))

  return artists

def timestamp_by_artist(data):
  """ Process a list of plays into a set of lists of timestamps indexed by artist
  """
  plays = {}
  timestamps = []

  for item in data:
    name = item['artist_name']
    if item['artist_name'] not in plays:
      plays[name] = {
        'total': 0,
        'timestamps': []
      }

    plays[name]['total'] += 1
    plays[name]['timestamps'].append(item['timestamp'])
    timestamps.append(item['timestamp'])

  return plays, timestamps

if __name__ == "__main__":
  with open('data/plays.json') as file:
    data = json.load(file)

  plays, timestamps = timestamp_by_artist(data)
  with open('data/stamps.json', 'w') as file:
    json.dump({'artists': plays, 'all': timestamps}, file)

