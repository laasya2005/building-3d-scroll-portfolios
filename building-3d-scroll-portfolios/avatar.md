# The live presenter (person's avatar)

Goal: the person feels present. Looks at the visitor, waves on arrival, reacts on click. Two assets: a **still resting portrait** and **short action clips** for gestures.

## 1. Generate footage (Google Flow / Veo, Frames to Video)
- First make ONE base image from the person's photo: waist-up at a desk, centred, **plain seamless backdrop matching the site background colour**, 16:9, generous empty space on both sides.
- Every action clip: start frame = end frame = base image, "locked-off static camera, no zoom/pan/cuts", returns to exactly the starting pose. Clips: wave, laugh, coffee (optionally typing, thinking).
- Download 1080p. Audio irrelevant (played muted).

## 2. Process clips (reference/encode-video.sh)
- Veo never truly returns to the start pose. Measure per-frame similarity to frame 0 (head/torso crop, normalised cross-correlation) and **cut each clip at the best-matching frame in its last 40%**.
- Crop around the person, encode 1280w and 720w (`-sm`) H.264 `+faststart`, no audio.
- Overlay any brand fixes (e.g. a logo on a laptop lid) at a fixed position: camera is locked off so it never moves. Check no hand/object occludes that spot in any clip.

## 3. Resting portrait
- Pick the cleanest frame: head upright, **eyes open, looking into the lens** (scan frames, do not trust frame 0). Export it at site resolution with the same crop and overlays as the clips, so crossfades are invisible.
- It doubles as the poster shown before anything loads.

## 4. Director (Presenter.tsx)
- Modes: `look` (still `<img>`) | action clip on two cross-fading `<video>` layers. Clip `ended` → back to `look`.
- Arrival: wave once after the loader. Click / hovering the bubble: laugh (6s cooldown). Do not trigger it on hover over the large portrait (accidental replays).
- Layout morph every frame from smoothed progress: large portrait (hero/contact) ↔ circular bubble (journey). Animate `clip-path inset(... round r)` + translate/scale. Bubble crop = head and shoulders, not a tight face.
- Reduced motion: no clips, still portrait only.
- A speech bubble beside the presenter shows the anchor's `line` in first person.

## Failures to avoid
| Symptom | Cause | Fix |
|---|---|---|
| Arm / desk see-through | Edge mask or hero text wash overlaps body | Feather only far edges (≤3% left), stop wash at ~40% width |
| Clip pops on loop | Clip ends on different pose | Cut at measured best-match frame, crossfade |
| Resting frame looks off to the side | Picked frame 0 of a clip | Scan frames, choose eyes-to-lens |
| Any layer hidden behind the poster | DOM order | Keep the active media above the poster `<img>` |
