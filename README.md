# Friends Drive OS

Vehicle-aware infotainment shell that inspects the connected display at startup and switches layout composition automatically.

## Display profiles

The matcher scores geometry — orientation, width/height ranges, aspect ratio, optional devicePixelRatio, known HDMI-bridge hints, and any stored hardware fingerprint. It does **not** identify a vehicle from a single exact resolution.

| Profile | When it wins | Layout |
| --- | --- | --- |
| `RAM_12_4_PORTRAIT` | Tall / portrait RAM-like viewport | RAM portrait cockpit |
| `RAM_AV_CM01` | Landscape HDMI-like viewport (geometry ranges, not a claimed native RAM resolution) | RAM HDMI Bridge |
| `FORD_F250_12_LANDSCAPE` | 12-inch class landscape | Ford landscape shell |
| `TESLA_MODEL_Y_LANDSCAPE` | Wide 16:10-class landscape | Tesla landscape shell |
| `RAM_AUTO` | RAM family with either orientation | Resolves to portrait or HDMI |
| `GENERIC_PORTRAIT` / `GENERIC_LANDSCAPE` | Low-confidence fallback | Neutral Friends Drive shells |

Future selection is designed to combine **display geometry + vehicle identity + host/adapter identity**. Query hints already work: `?vehicle=ram&adapter=av-cm01`.

## Settings

**Settings → Display** shows detected profile, confidence, active layout, and mode. Override modes persist locally:

`AUTO` · `FORCE RAM PORTRAIT` · `FORCE RAM HDMI` · `FORCE FORD` · `FORCE TESLA` · `GENERIC`

Calibration (scale, safe area, touch target) is stored **per profile**.

**Display Diagnostics** includes **Copy Display Report**.

## Develop

```bash
npm install
npm test
npm run dev
```
