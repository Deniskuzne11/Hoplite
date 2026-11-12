# 06:00 — Series memory

Animated series, vertical 9:16 (1080×1920, 30 fps) for Reels / TikTok. Theme: **zombie apocalypse**.
Narrator: Ksyusha, first person, past tense, short tense sentences.

---

## Episode 1 — "06:00" (88.6 s)

### Final narration (as recorded)

> We were given until six in the morning.
> The radio repeated it three times: last convoy, the stadium, one wristband — one seat.
> I had two wristbands, a crowbar, and Tyoma, who never stops asking questions.
> The bridge was the only way to the stadium — and they were standing on it.
> "Why are they just standing there?" — "They're listening, Tyoma."
> So we went through the courtyards. I've known every one of them since I was five.
> But the last passage was boarded up. The board came off with a crash, and the whole street heard it.
> A nail tore my palm. Behind us, on the bridge, they all turned at once.
> We ran — straight into two men with rifles. "Wristband. The kid's. He'll manage without one."
> Then Tyoma asked his question: "Mister, why are you hiding your hand?"
> Under the sleeve was a bite. His partner stepped back and fired. The gunshot brought the whole bridge after them.
> Five fifty-two. Stadium. Floodlights. They weren't evacuating anyone. They were sorting people.
> The guard shone his flashlight on my palm: "To the left."
> And from the dark stands, a voice I knew shouted to my brother: "Run."

Intonation-cue version: `episode01/voiceover.md` (generic cues) and `episode01/voice/full_v3.txt` (what was sent to ElevenLabs).

### Scenes (clock in frame → what happens)
1. 04:10 — black, red LED clock, heartbeat. Hook line.
2. Kitchen, heat lightning — radio; Ksyusha's fist with two paper wristbands (№ 0417, 0418).
3. 04:25 street — walking; crowbar in her back pocket; Tyoma holds her sleeve; "?" pops over him.
4. 04:40 bridge — infected stand motionless under a flickering lamp; snap zoom on "they".
5. 04:41 behind a car — Tyoma asks; Ksyusha "shh": *they're listening* (rule: the infected react to sound).
6. 04:52 courtyards — arches, laundry, a cat; her home turf.
7. 05:05 boarded passage — crowbar; the board flies off on "crash"; sound rings fill the street.
8. 05:06 — nail tears her palm (close-up, blood); warm rain starts; the whole bridge turns at once.
9. 05:30 street — running straight into Tall + Stocky with rifles; they want Tyoma's wristband.
10. 05:31 — Tyoma: "Mister, why are you hiding your hand?" — Tall keeps his right hand in the sleeve.
11. 05:33 — sleeve slides: a bite. Stocky steps back and fires at Tall. The gunshot pulls the infected; the crowd floods past the doorway where Ksyusha and Tyoma hide.
12. 05:52 stadium, gray dawn — floodlights, fences, two lines: "← LEFT · BITTEN" / "RIGHT · CLEAR →".
13. 05:55 — the guard's flashlight on her torn palm: "To the left." Tyoma is pushed right; their hands come apart.
14. 05:59 — dark stands, a figure with two glints; close-up of Tyoma turning. "Run." → black → red "06:00", "EPISODE 1".

### How episode 1 ended (cliffhanger state)
- **Ksyusha** is in the LEFT ("bitten") line because of her nail wound. She is *not* bitten — only she (and the viewer) knows it.
- **Tyoma** is alone in the RIGHT ("clear") line, separated from his sister. He still has his wristband.
- A **voice Ksyusha knows** shouted "Run." to Tyoma from the dark stands. Identity not revealed. "Run" implies the clear line is not safe either.
- **Tall** (bitten) was shot by **Stocky**; Stocky ran with the crowd behind him — fate unknown.
- Time: 05:59. The city locks down at 06:00. The last convoy is leaving.
- Ksyusha still has the **crowbar**.

### Open threads for episode 2
- Who is the voice in the stands? (Must be someone Ksyusha knows: parent, teacher, friend, neighbour.)
- What really happens to the LEFT line? What happens to the RIGHT line?
- Does Tyoma run — and where? Does he find his sister?
- The rule "they react to sound" — Ksyusha already used it once (unwillingly); it should pay off again.
- Did Stocky survive? He saw Ksyusha and Tyoma.
- Tyoma's habit of asking questions saved them once; it can endanger them next time.

---

## Characters

| Who | Look (as drawn) | Role / traits |
|---|---|---|
| **Ksyusha**, 16 | dark teal hoodie, dark navy jeans, light sneakers, dark-brown hair in a low ponytail; red crowbar | High school senior, narrator. Knows the old centre "like the back of her hand" since age 5. Decisive, protective, tired. Wounded palm (nail). |
| **Tyoma**, 8 | mustard-yellow T-shirt with a "?" on it, navy shorts, red sneakers, blue backpack, big eyes, cowlick | Her younger brother. Never stops asking questions — his question exposed Tall's bite. |
| **Tall** | olive jacket, dark cap, stubble, rifle slung; right hand always hidden in the sleeve | Armed man; bitten and hiding it because the stadium checks bites. Shot by his partner. |
| **Stocky** | dark tactical vest, buzz cut, stubble, rifle | Armed man; wanted Tyoma's wristband; panicked and fired at Tall. Status unknown. |
| **Guard** | light-gray hazmat suit, gas mask, flashlight | Stadium checkpoint; sorts people by bites. |
| **The infected** | gray-green skin, glowing pale eyes, torn clothes, patchy hair | Stand still and *listen*; react to sound, all turn at once; run in packs. |
| **The voice (???)** | dark hooded figure in the stands, only two eye glints visible | Knows Ksyusha. Shouted "Run." Reveal planned for episode 2+. |

## Visual style
- Flat 2D vector characters (simple limbs, round heads), drawn in code: `episode01/art/lib.js` (characters, props, 6 locations) — reuse for every episode.
- Palette: night blues `#05070d #141a29 #1e2638`, sodium-lamp orange `#f0a94b`, danger red `#ff3b30` (LED clock, "RUN"), crowbar red `#b5332b`, infected skin `#7f8c6c`, infected eyes `#dfe8b8`, paper `#e8e1cf`.
- Always moving: flickering lamps, lightning, dust motes, rain (from the nail onward), swaying laundry, camera push-ins and shake.
- Red LED-style story clock at the top of the frame; large word-by-word subtitles at the bottom (orange = key words, red = danger words, light-blue italics = spoken lines).
- Locations available: kitchen, old-centre street, bridge, courtyards, boarded passage, stadium.

## Voice
- **ElevenLabs**, model **eleven_v3**, premade voice **"Jessica"** (voice_id `cgSgspJ2msm6clMCkdW9`), stability 0.5, output `mp3_44100_128` (free plan).
- v3 audio tags used: `[quietly] [tired] [whispers] [calm] [nervously] [in pain] [scared whisper] [out of breath] [low, rough voice] [innocently] [tense] [cold] [numb] [indifferent] [shouts] [pause] [long pause]`. Tags are not spoken; they get ~0 s in the alignment.
- Raw take ran 102 s (≈1.5 s pauses). Pauses longer than 0.55 s were trimmed (longer ones kept before "and they were", "Why", "Behind us", "Mister", "They weren't", and 1.45 s before "Run.") → 84.6 s of voice.
- Cost: ~1,400 characters for the full take + ~270 for three samples (Jessica, Sarah, Laura). Sarah did not whisper; Jessica chosen.
- Free plan note: free-tier ElevenLabs audio is non-commercial and requires attribution to ElevenLabs; monetised posting needs a paid plan.
- The API key (`ELEVENLABS_API_KEY`) only has text-to-speech permission; voice listing and quota checks are not allowed with it.

## Music and sound
- Background: **"spacedrone3.wav" by Elektrocell** (Freesound #20705, CC0), slowed to 0.82× (lower, darker), at **−33 LUFS = 19 dB under the voice**; cuts out on "Run." and returns quietly under the title card.
- 16 CC0 effects from Freesound (heartbeat, radio static, thunder, city night, footsteps, wind, moan, creaks, wood break, crowd, rain, running, gunshot, floodlight hum). Full list with links: `episode01/SOURCES.txt`.
- Final mix: −14.0 LUFS integrated, −2.0 dBTP, AAC 192 kbps 48 kHz.

## How to rebuild / make the next episode
```
cd episode01
node voice/eleven.js say <voice_id> eleven_v3 voice/full_v3.txt take1 0.5   # voice + timestamps
node voice/tighten.js take1 voice_final 0.55                                 # shorten pauses
node anim/make_timing.js voice/voice_final.alignment.json                    # word timings
node anim/render.js video out/video_final_silent.mp4 30                      # picture (~7 min)
node sound/mix.js voice/voice_final.wav                                      # mix → out/mix.wav (−14 LUFS)
ffmpeg -i out/video_final_silent.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/06-00_episode01.mp4
```
All animation beats and sound effects are anchored to spoken words, so a new take re-syncs automatically.
New CC0 sounds: `node sound/freesound.js search "<query>"`, then `node sound/freesound.js get <id> <name>` (verifies CC0), then `node sound/make_sources.js`.
