# Ḥikma Merged Engine — parity list

Audit date: 2026-11-16 (first run). Next full re-audit due: 2026-11-23, or the first Sunday run.
Sources read: the merged page (all 1,101 lines), the Iḥyāʾ Engine (A) — kit/PLAN.md v1.4–v3.18, the shell's 45 modules, file list (217 files); Kunūz al-Dhikr (B) — notes/CHANGELOG.md (passes 1–3), index.html views and controls, file list (247 files); Teacher Library (C) — its single page (7 tabs).

"Done" means the feature works inside this engine, in full, with its real data — not an index, a count or a link out.
Order: what Al uses every day first. One item per run. Tick with date and one line.

## Port order (Al's standing order, 2026-11-16)
- [x] 1. Ṭilasm Studio — 2026-11-16 (run 2)
- [x] 2. Rest of the Ashkāl forge UI — 2026-11-17 (run 3): all 414 open figures (167 squares, 58 letter squares, 131 talismans/seals/circles, 58 tables) with kind and chapter filters; image plates with angels' frame, paper/dark, lines above/below, PNG; four elements + mirror; printed figure beside; "as a plate"; auto-fallback way; bare / with al-; prev/next
- [x] 3. al-Ḥalqa with its database — 2026-11-17 (run 4): Learn → al-Ḥalqa: the day's eight steps at their times (verse + Name count, first-hour square, ṭarīqa wird with choice of order, Yā-Sīn portion + the day's Names, lesson, MCQ review, closing verse, journal), the watch of the hours (next of the Ninety-nine: pages read, count, square, a word), "hand him a working" queue, lesson composing, course pointer, earlier lessons, now-performing bar on every tab; `db` collections halqa, lessons, journal; A's halqa/state and 9 lessons copied. Study collections (study, units) come with port 4
- [x] 4. The Study — 2026-11-17 (run 5): Learn → The Study: the 855 lessons (identical to A's cut), the teacher's choice / forgotten / in order / one chapter, chapter maps, recaps, prayer pauses and hourly rests, spaced review MCQ only (1, 3, 8, 20… days), 'I don't know', raise your hand, course map with status of every lesson, chapter exam (80% passes) with the record of reading; A's study/progress and 23 units/* copied, joined on every save
- [x] 5. Kitāb reader with figures inline — 2026-11-17 (run 6): Read → Kitāb: all 22 chapters (pp.1–2401) in the book's order with chapter nav, Read / Overview / Sections / Figures / Workings / Corrections / Search / Your reading; the 874 printed Arabic lines as images, every open figure inline with the engine's reading re-summed, ◇ highlights, ☆ bookmarks, page jump, contents, A−/A+, page / sepia / paper, English-only read-aloud, Alt+←/→; 660 numbered workings (225 sealed by title) linked to their operation pages; book/ch00–21.json copied to ihya/book/
- [x] 6. Kunūz: practice runner + tasbīḥ, awrād reader, Dīwān, sohbahs reader, Kunūz al-Ḥalqa, the Ustādh — part 1 done 2026-11-17 (run 7): the daily wird with merged ticks, the guided practice runner, Practices & the sacred year, the Tasbīḥ (My day). part 2 done 2026-11-17 (run 8): the awrād reader with the Sharḥ and Rev5 (Read → Kunūz · Awrād). part 3 done 2026-11-17 (run 9): the Dīwān (Read → Kunūz · Dīwān). part 4 done 2026-11-17 (run 10): the 2,302 sohbahs with B's word index (Read → Kunūz · Sohbahs). part 5 done 2026-11-21 (run 11): Kunūz al-Ḥalqa (Learn). part 6 done 2026-11-22 (run 12): the Ustādh (Ask → The Ustādh). part 7 done 2026-11-22 (run 13): the Maktaba (Read → Kunūz · Maktaba) — all six Kunūz parts are in
- [ ] 7. Iḥyāʾ: Wird + Ninety-nine, Qurʾān (9 tafsīrs, 3 qurrāʾ), Journal, al-Muʿallim, Today extras, Ṭarīqa, Niyya, Nuṭq, Khādim, Qalam — part 1 done 2026-11-22 (run 14): Wird and the Ninety-nine (Learn → Wird & the Ninety-nine; ihya/wird.js). part 2 done 2026-11-22 (run 15): the Qurʾān (Read → Qurʾān; ihya/quran.js) with the nine tafsīrs, In English, Teach me this verse, and Alafasy's whole recitation in the asset store — al-Ḥuṣarī and al-Minshāwī still to copy (first step of run 16). al-Ḥuṣarī and al-Minshāwī copied 2026-11-23 (run 16): all three qurrāʾ complete. part 3 done 2026-11-23 (run 16): the Journal (My day → Journal; ihya/journal.js). Next: al-Muʿallim, Today extras, Ṭarīqa, Niyya, Nuṭq, Khādim
- [ ] 8. Teacher Library lessons view

## Done on the first run
- [x] Decision 3: six top-level tabs (My day · Learn · Read · Forge · Reference · Ask); Verses, Squares, Operations, Materials and Timing are one Reference tab with a type filter; the Merge-status tab removed (status lives in kit/PLAN.md) — 2026-11-16
- [x] Decision 1 (this page): the Ask read-aloud skips every Arabic run and every transliterated word; no other synthetic speech exists in this page — 2026-11-16
- [x] Read tab, first part: the Iḥyāʾ English text page by page (pp.2–2400) with whole-book search; Kunūz search over the awrād, Dīwān, Sharḥ and practices — 2026-11-16
- [x] Learn tab holds the Abjad calculator and Square lab (moved out of Ask) — 2026-11-16

## Cut (Al's decisions)
- [x] CUT: A: Voice / nuṭq Arabic synthetic speech (tools/voice.jsx Arabic runs, nutq romanised read-aloud of Names and verses) — decision 1, robot Arabic is out
- [x] CUT: B: "How Arabic is voiced" (Arabic voice and transliteration respelt for the English voice) in Read aloud, the practice runner's "Say it with me" / "Recite the count", Recite with me and the Ḥifẓ drill — decision 1; replaced by real recitation or silent Arabic on screen
- [x] CUT: A: al-Ḥalqa speaking Names × abjad and litanies by machine voice — decision 1; the count stays, the voice goes (real recitation where a Qurʾānic source exists)
- [x] CUT: A: Wird → Pronounce scoring against a machine-spoken model — decision 1; becomes "record it myself" and the teacher's recordings
- [x] CUT: A: Atmosphere Hz frequencies, pure tones and binaural beats (tools/ambience.jsx) — decision 3; keep one optional quiet ambient sound
- [x] CUT: merged engine "Merge status" tab — decision 3
- [x] CUT: duplicate data: kunuz/sohbah/t-*.json and B's sohbah/s-00…s-11 (old, unused in B) are never copied twice; one copy of each dataset — decision 3
- [x] CUT: A: Qalam pen-plotter output — not used by Al; keep SVG/PNG/print instead (revisit if Al asks)
- [x] CUT: A: ch.20 litanies that adjure spirits (taskhīr) as performed practice — already reference-only in A (v3.12), house rule

## Next: the design system (comes right after the first run)
- [ ] Design: kit/design.css (tokens + components) and kit/DESIGN.md with screenshots; five themes (Lapis Night, Parchment, Andalusī Emerald, Mughal Rose, Planetary) saved per viewer; WCAG AA checked by script on every theme; inline-SVG girih borders, star rule, ʿunwān headpiece per tab, sūra cartouches, faint tile ground; Amiri / Aref Ruqaa / Marcellus / IBM Plex; bottom tab bar on phones, top on desktop; ≥44 px targets; safe areas — done when every current screen uses only design.css tokens and all five themes pass the contrast script
- [ ] Design: signature visuals — planetary-hour dial (24-segment ring around the khātam, current hour glowing, countdown), lunar-mansion wheel restyled, moon in true phase; squares as jewels with gold "verified ✓" seal and carnelian "check failed" mark; status badges component — done when My day and Forge show them at 390 and 1280 px

## Daily use — ports from the source engines
- [x] (2026-11-17) A: al-Ḥalqa — the day's circle step by step at its times (day's verse and Name, the first-hour square, lesson at Ẓuhr, review at ʿAṣr, Q 36:82–83 at Maghrib, journal at ʿIshāʾ), Stop final for the day, resume per step; real recitation for Qurʾān steps, the Name count silent on screen — done when a full day runs here with A's lessons/<date> and halqa/state records copied into this page's database
- [x] (2026-11-17) A: the Study — 855 lessons pp.40–2401, spaced review (1, 3, 8, 20… days), course map of 22 chapters, session length and daily goal, chapter exam (MCQ, 80% pass); study/progress and units/* copied. Not ported: A's typed/spoken grading (Al: MCQ only) and DarsCheckin (the mood check-in that suggests a session length)
- [ ] Database for Al's progress: `db` capability with collections halqa, lessons, study, units, wird, tracker, bookmarks, notes, owned_materials, counters, journal, plans, flags, ideas, teacher_queue, corrections, mastery; existing records copied from A's and B's databases — done when A's and B's records read back from this page
- [x] (2026-11-17) B: Practices runner — daily practices and occasions ("Do it now", "Do it step by step"), the counter with −1/reset, screen kept awake, seven-day strip, the Ḥizb al-Wiqāya ways as alternatives — done when every practice in kunuz/practices.json runs here with the Arabic shown (no machine voice)
- [x] (2026-11-17) B: wird ticks per day that merge across devices (wird/<date>, item timestamps, later action wins) — done when B's wird history is copied and ticking on two devices merges
- [x] (2026-11-17, B's part; A's breathing circle and journal entry added 2026-11-22 in Wird → Count with him; a tracker collection still open) A+B: Tasbīḥ / Wird counter — big tap target, Space/Enter, haptic tick, targets (33/33/34, 100, Ḥasbunā 450, a Name's abjad, custom), per-device tallies that add up, totals per day to the journal; breathing circle — done when it logs to the tracker collection
- [x] (2026-11-22, run 14) A: Wird → The Ninety-nine flash cards on spaced review (N new a day) and My path (book %, hours this week, retention, streak, dhikr counted, 14-day bars, weekly letter) — cards and stats from this page's db (study/wird, study/progress); A's study/wird copied; also Count with him (adhkār, Names × abjad, own dhikr, breath guide, count each breath, count by voice, journal), Say it (listening check, no machine model), DarsCheckin
- [ ] A: Home "From the book today" (a Name, an open working, a section — steady for a day) — on My day
- [ ] A: Planetary Hours full table + Majlis ("this hour and what it is for") + next-hours-of-a-planet countdowns — on My day (the 24-hour table exists; Majlis does not)
- [ ] A: Niyya — choose a need → planets whose hours the book opens for it (pp.116–117, open uses only), next three hours each, the open workings for that need, Tadbīr plan with the prologue's conditions as steps, inauspicious lunar days skipped — done when plans save to the plans collection
- [x] (2026-11-23, run 16) A: Journal — entries stamped with day, hour, mansion, lunar day (+ Hijri date and place); export/import JSON (A's export file imports as it is; A's database holds no journal collection, A's browser copy lives only in A's own browser and comes over by its Export → Import here); db journal/<id> across devices; outcomes to add; Write it in the journal from any operation page; Ask read_journal / write_journal / open_journal
- [ ] A: Today (alyawm) — the day's square and instruments beyond what My day shows (the ruler's order square at the first hour, ch.20 reference fold)
- [ ] A: tariqa awrād — Naqshbandī-Ḥaqqānī daily adab, Shādhilī wird al-ʿāmm, Chishtī bārah tasbīḥ with counters (tools/tariqa.jsx) — done when each runs with its count here
- [ ] A: the Qurʾān before Fajr — armed by a tap, N minutes before Fajr from Al's place, screen kept awake, on-screen note that browsers block autoplay — done with real recitation
- [ ] B: Today card — prayer times for 175 places + coordinates, five calculation methods, high-latitude fallback, the Today verse 13:28 with English — My day has 11 places and 4 methods; done when the 175-place list and Karachi method are in

## Reading
- [x] (2026-11-17) A: Kitāb — the full book reader from book/ch00–ch21.json (headings, figures clipped from the page, printed Arabic as images, squares set as grids and re-summed, bookmarks, "read from here", citations open at the page) — done when book/*.json and figs packs are copied (split across publishes) and every chapter opens
- [x] (2026-11-22, run 15; al-Ḥuṣarī and al-Minshāwī copied 2026-11-23) A: Qurʾān module — Tanzil Uthmani text, transliteration, Pickthall and Yusuf Ali, nine tafsīrs (al-Jalālayn, Ibn Kathīr, al-Qushayrī, Ibn ʿAjība, Ḥaqqī, al-Najmiyya, al-Qāshānī, al-Sulamī, al-Tustarī), "In English" and "Teach me this verse" — done when quran/*.gz.txt are copied and any āya opens with its tafsīr
- [x] (2026-11-17, run 8) B: Awrād reader — books/meta.json + per-section files (Naqshbandī awrād & Dalāʾil, Qādirī, Shādhilī aḥzāb), Arabic + transliteration + English line by line, typeface choice, previous/next section, deep links — done when every section opens here without a machine voice
- [x] (2026-11-17, run 8) B: Sharḥ Ḥizb al-Baḥr reader (page by page) and Rev5 — done when sharh.json and rev5.json read here
- [x] (2026-11-17, run 9) B: Dīwān — all 1,240 posts with B's filters (search through the vowels with the words marked, topic, ṭarīqa, year, with text, documents, clear), clipped posts with Read all, link previews, documents, the opened post pinned with its link; better: topic chips and a year strip with counts, ☆ keep + Kept filter, previous/next, Qurʾān references read from the Tanzil muṣḥaf with abjad, abjad of each Arabic line, the same text posted again, Ask about this post, #read/diwan/<id>, search_kunuz hits open the post, Ask tools read_diwan_post and open_diwan
- [x] (2026-11-17, run 10) B: Sohbahs — 2,302 talks: title search as you type, every-word search through B's word index (17 fx shards copied; ranking identical to B's on 10 queries), lazy passages, random, previous/next; better: paragraphs, find-in-sohbah with ‹ › and count, A−/A+, place kept per sohbah with a reading bar, ☆ keep + Kept, Recently read, Qurʾān references read from the muṣḥaf with abjad, Ask about this, #read/sohbah/<n>, English-only read-aloud, Ask tools search_sohbahs_fulltext and open_sohbah. (kunuz/sohbah/t-* already were B's v2 shards — one copy, nothing to drop)
- [x] B: Maktaba — the library (library.json), the libb/*.wasm page-image books, the two HTML editions (Ḥizb al-Wiqāya, Laṭāʾif codex), docs.json, media gallery with lightbox — done when every libb book opens and pages turn — done 2026-11-22 (run 13): kunuz/maktaba.js; 24 books, 37 packs, two editions carried without scripts, 36 images, 198 documents
- [ ] B: unified search (also `/` key) across posts, awrād, Sharḥ, Rev5, books, practices, teachings, docs, sohbah titles and full text — merged into the engine-wide search below
- [ ] C: Teacher Library — courses → lessons → operations view with the full lesson text (not only operations) — done when C's lib-data is copied and every lesson opens
- [ ] C: Questions for my teacher — the list with answers, merged with the teacher queue (Round 2/6)
- [ ] C: Names index and Cross-check tab content (folded into Reference entries with trust badges)
- [ ] C: Sources & progress (folded into kit/PLAN.md; not a tab)

## Learning
- [x] (2026-11-21, run 11) B: al-Ḥalqa lessons (Kunūz) — Learn → Kunūz al-Ḥalqa: B's 61 lessons in 8 tracks (kunuz/halqa.json), the circle (teacher's choice: seasonal by Umm al-Qurā month, next unlearned, review of missed questions every 4th), lesson composed from the posts, awrād section, Sharḥ pages and a Kunūz search (B's material + HSYS verbatim), 5 MCQ with A–D/1–4 and Enter, review list, study session with timer, syllabus take/retake, recite-with-me (repeat ×1/3/7/11, reading-pace follow-along, ←/→), ḥifẓ drill (hide 0–100%, tap to reveal), progress (taken, average, streak, review, minutes, tracks, recent), Ask in the circle; the day's lesson in the Kunūz wird (with B's 'include' switch). Better: composed lessons kept in the db (kunuz/les-<id>) and never paid for twice, abjad of each Arabic line, Qurʾān refs named, withheld lines kept out, Ask tools kunuz_lessons / open_kunuz_lesson. Cut (decision 1): B's Sound & voice page (Hz tones, binaural, Arabic voice) and every Arabic read-aloud
- [ ] A: al-Muʿallim teacher persona tools (search_book, engine_lookup, find_workings, compose_talisman, open_in_engine, journal) — merged into Ask
- [x] (2026-11-22, run 12) B: the Ustādh — Ask → The Ustādh: B's instructions verbatim, its six questions, search_corpus (B's one-index ranking: identical to B on 12 of 13 test queries; the 13th differs only by the four Ḥizb al-Baḥr lines the merged engine withholds), search_sohbahs (identical top 5), get_post, a 40-message conversation. Better: the engine's readers as tools, the conversation in the db (kunuz/ask-ustadh, kunuz/ask-engine) across devices, every cited post / sohbah / Sharḥ or Rev5 page / Iḥyāʾ page / operation tappable, quiz choices as buttons, 'Ask the Ustādh' from the awrād, Dīwān and sohbah readers. Missing until the Maktaba port: the channel's PDF books (B's library.json) in search_corpus
- [ ] A: Ḥurūf (letters, values, elements), Basṭ (expansion and the nine mīzān), Asmāʾ (the Names with values), Fawātiḥ, Sawāqiṭ, Shields (letter-by-letter running sum) — Learn → letters, each a working tool
- [ ] A: Ḥaqāʾiq (expositions), Sharṭ (conditions before any work), Durūs (occult-squares course), al-Sirr al-Jalīl (the verse of 450, a whole book) — Read/Learn
- [ ] A: Lunar Mansions module (the 28 with the book's judgement) and Falak (12 signs and natures) — Reference → Timing

## Forge and squares
- [x] A: Ṭilasm Studio — Forge → Ṭilasm Studio: 422 of the 450 compositions (28 left out on sealed pages), the 8 Durūs constructions, rings / spokes / segments / seals / sign-grids, the printed figure as vector with its square rebuilt for any Name, text or number and re-summed, need / person / mother slots, editable written parts, 4 numeral scripts, clean redraw, as-printed and beside-the-figure views, SVG/PNG; data copied (ihya/tilasm.json, ihya/plot_0–5.json, ihya/amiri-arabic.woff) — 2026-11-16 (second run). Not ported: send-to-plotter (Qalam cut)
- [x] A: Figure Forge (shakl) and Ashkāl (every figure enlarged from the page) — Forge → From a figure of the book — 2026-11-17
- [ ] A: Qawāʿid (construction rules), Khātam (seals and ring inscriptions), Plate (every verified square on one sheet), Library (every square and seal) — Forge/Reference
- [ ] A: Works (licit programs), Bakhūr · ʿAdad (incense, counts and states), Shurūṭ (conditions of time) — Reference entries
- [ ] A: Grimoire (what Al has kept) — merged with bookmarks

## Checking (decision 6 starts here)
- [ ] A: Review (approve or query each correction) and Taṣḥīḥāt (corrections to the book) — merged into "Errata for every source"
- [ ] A: Atlas, Concordance (against the sister editions), Method, Glossary, About — Reference
- [ ] A: Index (every record with its page) — merged into the engine-wide search

## Round 1 (feature backlog)
- [ ] Real recitation player — reciter choice (Alafasy, al-Ḥuṣarī; A already holds Alafasy, al-Ḥuṣarī and al-Minshāwī for all 114 sūras in its asset store, openly sourced from EveryAyah — copy those assets server-side by id), repeat-āya ×1/3/7/11/100, slow mode, word highlighting from api.quran.com word segments; kit/audio.json kept — done when 5 random āyāt play and match the text shown
- [ ] Dhikr counter on the tracker (big target, haptic, target from the operation, logs) — with the Tasbīḥ port above
- [ ] "My day" home — hour dial with countdown, today's al-Ḥalqa lesson, awrād tick-offs, what fits this hour, streak
- [ ] Spaced-repetition review of missed MCQs (1, 3, 7, 21 days)
- [ ] Pre-Fajr Qurʾān (one-tap begin, autoplay note)
- [ ] Forge print mode (exact size cm/in, materials and timing beside, verification stamp)
- [ ] Materials cards with "I have this" filter (owned_materials collection)
- [ ] Unified Arabic-aware search grouped by source (Iḥyāʾ, Kunūz, Teacher, Reference) on `/` and the header
- [ ] Bookmarks and notes on every item
- [ ] "Record it myself" on any Arabic item (microphone/file capability), also for the teacher's 1-on-1 pronunciations; Names play from a recited āya with verse and time range, otherwise vowelled Arabic + transliteration + syllable guide

## Round 2
- [ ] Guided working mode (adab checklist, materials, wait-for-hour countdown, real audio + counter, writing the plate, consecration, aftercare; every step cites its page)
- [ ] Timing finder (next windows in 60 days by day/hour/mansion/moon phase; .ics export)
- [ ] Working journal (date, hour, intention, operation, materials, counts, plate photo, outcome, follow-up) — the Journal (run 16) covers all but the plate photo; add the photo (assets) next
- [ ] Wird builder
- [ ] Retreat (khalwa / arbaʿīn) mode
- [ ] Hijri calendar of sacred days with their practices
- [ ] Name analyser (Mashriqī + Maghribī abjad, elements, every occurrence; the sources' own mother's-name methods exactly as described and cited)
- [ ] Letters & correspondences trainer
- [ ] Compare view across the three sources
- [ ] Photo lookup (photo of a square/page → read, recompute, match)
- [ ] Shopping list
- [ ] Questions-for-my-teacher queue with recorded answers
- [ ] "Word from the masters" daily (paraphrase, work named, never invented)
- [ ] My book of practices (printable PDF in manuscript style)
- [ ] Weekly progress line

## Round 3
- [ ] Need finder (need → Names, verses, practices, timing, materials from all sources, compared)
- [ ] Phone reminders via Google Calendar (plans → events "Ḥikma · …", 15-min popup)
- [ ] Talisman gallery
- [ ] Study map (illuminated tiles filling with gold)
- [ ] Hifẓ helper (listen-repeat-hide-recite, real recitation)
- [ ] Preparation cards (inks, fumigations, oils, waters, plates — proportions only if stated)
- [ ] Card of the day (Hijri date, its abjad, day planet, mansion, linked practices)
- [ ] Focus session (timer, ambient, full-screen parchment reading, logged)
- [ ] Offline-friendly cache (IndexedDB, try/catch)

## Round 4
- [ ] "From my teacher — new" panel on My day
- [ ] Teacher timeline (courses, YouTube, Instagram by date and topic)
- [ ] Cards that open the original YouTube video or Instagram post at the right moment (a link)
- [ ] "This is wrong" flag on every item (flags collection; next run fixes it first)
- [ ] "I wish it could…" idea box (ideas collection)
- [ ] "What's new in the engine" card (from kit/whatsnew.json)
- [ ] Ask upgrades (tappable source links — done for posts, sohbahs, Sharḥ/Rev5 pages, Iḥyāʾ pages and operations on 2026-11-22; still to do: verse refs and square ids tappable, "the sources disagree" with both shown)
- [ ] Contradiction watch (new teacher content vs the Iḥyāʾ and Kunūz → Questions for my teacher)
- [ ] Weekly database backup to Drive "Ḥikma Engine Backups"
- [ ] Self-test page (long-press on the khātam)

## Round 5 (from the teacher's Instagram — Drive doc "Instagram capture — sufistic_mystic — 2026-11-16")
- [ ] Teacher's talisman catalogue (one card per named seal: purpose, components, materials, timing, his links, transcribed images, what the Iḥyāʾ and Kunūz say, status badge)
- [ ] Exaltation (sharaf) calendar with reminders
- [ ] Letter-mansion finder
- [ ] Angels & planets table
- [ ] Stones, rings & metals planner
- [ ] Rūḥānī ink and fumigation lab
- [ ] Water preparations as guided procedures
- [ ] Handwriting practice sheets of the formulas and letter talismans (vowelled, with abjad)
- [ ] Sirr al-Jalīl hub (Al's source + every teacher work based on it)
- [ ] Teacher's works gallery (links + verified rebuilds)

## Round 7 (from run 9)
- [ ] Dīwān: ☆ kept posts into the database (bookmarks collection) so they follow Al across devices
- [ ] Dīwān: a post in "Naqsh & Awfāq" that cites a verse gets "Forge this verse" (its square built and re-summed in the Forge)
- [ ] Dīwān: documents named in posts matched to the texts already carried (awrād sections, Rev5, Sharḥ) with an "Open the text" button

## Round 9 (from run 11)
- [ ] Kunūz al-Ḥalqa: missed questions also enter the Study's spaced review (1, 3, 8, 20 days) instead of B's 'every fourth lesson'
- [ ] Kunūz al-Ḥalqa: 'Compose ahead' — prepare the next 3 lessons in one go while Al is away (kept in the db), so a session starts at once
- [ ] Kunūz al-Ḥalqa: lesson cards on My day (today's lesson, streak) beside al-Ḥalqa's

## Round 8 (from run 10)
- [ ] Sohbahs: ☆ kept sohbahs and the reading place into the database (bookmarks collection) so they follow Al across devices
- [ ] Sohbahs: topic shelves (patience, rābiṭa, the Mahdi, dunyā, Ramaḍān …) built from the word index, with counts
- [ ] Sohbahs: the "Index of Quran Ayat cited by MaulanaSheikhNazim" sohbah (#2301) turned into a verse → sohbahs table linked to Reference → Verses
- [ ] Engine-wide search (`/`): fold the sohbah word index in beside the Iḥyāʾ, awrād, Dīwān and Reference

## Round 6 (decision 6 — checking, learning and Al's own voice)
- [ ] Trust badges and a "how sure is this?" panel on every entry
- [ ] "Proof" view on every number (abjad letter by letter, Mashriqī and Maghribī; every square line sum shown)
- [ ] Corrections to offer my teacher (respectful list with proof; asked / teacher agreed / teacher explained; engine updates and credits him)
- [ ] Errata for every source (Iḥyāʾ continuing Al's corrections list, Kunūz, the engine's own past mistakes)
- [ ] Al's own notes and findings as a fourth source ("Al") with its own badge
- [ ] Teaching revisions tracker (versions with dates)
- [ ] Safe-practice gate in guided mode (trust badge; "teacher only" or "differs" said plainly with alternatives)
- [ ] Outcome notes per operation (private, from the journal, never presented as proof)
- [ ] Mastery path (letters and abjad → squares → timing → Names → full workings, each closed by an MCQ test)
- [ ] "Explain it like a teacher, check it like a scholar" mode in Ask

## Round 10 (from run 12)
- [ ] Ask: verse references (Q 3:173) and square ids (N94, F400) in answers open Reference → Verses / Squares
- [ ] Ask: a list of past conversations per teacher (not only the latest 40 messages), with search
- [ ] Ask: "Ask both" — the same question to the engine and the Ustādh, answers side by side (decision 6: show both)
- [ ] Ustādh: when the Maktaba lands, put the channel's PDF books into search_corpus (B's library pages) and re-run the 13-query comparison

## Round 10 (from run 13)
- [ ] Maktaba: text layer for the image-only books (14 Ḥizbs, Initial Sulūk, Ikhfāʾ) — transcribe page images so search and the Ustādh can see inside them
- [ ] Maktaba: Arabic lines on Maktaba pages with their abjad (Mashriqī, by code), as the awrād reader does
- [ ] Ask: a Maktaba citation "Title p.N (DhikrNotes #post)" tappable in answers (opens the page)
- [x] (2026-11-22, run 14) Fold the Learn note's "Still in the original engines" row into index.html — the Kunūz row now names only the 175-place list; the Iḥyāʾ row no longer lists Today's hours or the Wird

## Round 11 (from run 14)
- [ ] Wird: a "Record it myself" button on each Name (needs a microphone/recording capability — not on this account's roster yet; dictation gives text only)
- [ ] Wird: the Names play from a recited āya that contains them, once the recitation assets are copied (kit/audio.json names)
- [ ] Wird: the Kunūz Tasbīḥ's counts and the Wird counter's counts shown together on My path (one dhikr total per day)
- [ ] Wird: the Ninety-nine cards also show the Name's Reference entry (operations, squares and verses that use it), tappable

## Round 12 (from run 15)
- [ ] Qurʾān: copy al-Ḥuṣarī (115 parts) and al-Minshāwī (114) into the asset store; fill their ids in quran/recit.json (first step of run 16)
- [ ] Qurʾān: word-by-word highlighting while the qāriʾ recites (api.quran.com word segments, cached as a file)
- [ ] al-Ḥalqa and the Kunūz runner: Qurʾānic steps (Q 36:82–83, the six sūras, Āyat al-Kursī) recited through window.QRAudio, the text lit with it
- [ ] Ask: verse references (Q 3:173, 36:82) in answers tappable → Read → Qurʾān at the āya
- [ ] Qurʾān: "the Names in this āya" chips (Reference Names found in the āya) and "where my sources use it" (Verses index chips) under each āya
- [ ] Qurʾān: a juzʾ / ḥizb view and the khatm tracker (pages read per day, into the db)


## 2026-11-22 — the two source engines retired (Al's change of priorities)
- Scheduled runs stopped: "Iḥyāʾ Engine — daily growth" and "Iḥyāʾ Engine — morning lesson for al-Ḥalqa" paused; the Teacher Library merge run was already off. Kunūz had no run of its own.
- Carried over before retiring: Kunūz's 175-place list, Karachi method, high-latitude rule (My day); the al-Ḥalqa database rows (lessons/2026-11-22, units u106/u109/u110, study/nutq, halqa/state).
- Ḥizb al-Baḥr fixed: runner skipped the house-of-Names lines, left out the Iʿtiṣām and Ikhtitām, had no counts, and hid four lines. All fixed; 73 steps to ✓ Finish.
- Shown whole as printed (Al's instruction): the 4 Ḥizb al-Baḥr khawāṣṣ lines, 7 working-book entries, 5 phrase sheets, the vessel construction (recite-8), Sharḥ p.81. Ustādh and lesson prompts quote litanies in full.
- Still not here, and why: the Iḥyāʾ's sealed workings (the book's author seals them; title and source only, as in the Iḥyāʾ Engine). Maktaba pages Rev1 pp.6, 7, 20 and Duʿāʾ Sayfī pp.47, 68, 72, 82, 83: Kunūz never stored them (PDFs on Telegram, posts 1024 and 579).
- Remaining ports for the build run: the Iḥyāʾ's al-Muʿallim, Ṭarīqa, Niyya, Nuṭq, Khādim; the Teacher Library's courses.
