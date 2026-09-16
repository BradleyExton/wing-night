# Song Guess audio

The pack in `content/sample/minigames/song-guess.json` ships as metadata only —
no audio is committed to the repo. Drop your own MP3s here (or, preferably, in
`content/local/minigames/song-guess/audio/`, which is gitignored and wins over
sample) using the `file` name each prompt declares.

The server serves this directory at `/song-audio/<file>`; the TV fetches the
clip from there and is the speaker for the round.
