# The reel's narrator (optional)

The film works without a narrator: every line is on screen and Beltrán speaks in three
places in his own voice. A narrator adds weight in two moments that are silent now. The
lines are his own words or the Institute's name; nothing new is claimed.

Generate them in ElevenLabs (Text to Speech) and drop the files in
`film/reel/assets/audio/` with these names; `film/tools/mix-reel.py` places them.

| file | line | starts at (video s) | must fit in | on screen at the same time |
| --- | --- | --- | --- | --- |
| `vo-know.mp3` | To know who we are, we must know where we come from. | 7.92 | 3.4 s | the line, word by word, over Ortelius' map |
| `vo-name.mp3` | The Institute for Hispano Studies. | 66.20 | 2.0 s | the eagle and the name |

Optional, if the first two work: `vo-claim.mp3`, "One civilization. Two languages. Four
continents." at 0.0 s, in 7.4 s with a pause after each sentence (it would read the opening
titles aloud).

## The voice

- English, a man's voice, low and calm, a documentary narrator rather than a movie-trailer
  voice: no growl, no echo, no music under it.
- Settings to start from: stability about 45 %, similarity about 75 %, style about 15 %,
  speaker boost on. Generate three or four takes of each line and keep the one whose
  rhythm is closest to the words on screen.
- Export each line on its own, MP3 44.1 kHz or WAV, with little silence at the start.
