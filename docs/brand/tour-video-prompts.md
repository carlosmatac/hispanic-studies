# Hero tour: prompts for the AI clips

Six short loops for the cards of the hero map's tour (`site/lib/hero-tour.ts`). Places and atmospheres only, never historical scenes or people: the rule is in [`imagery-and-rights.md`](imagery-and-rights.md). Generate with Veo (Gemini) and send them back; they are logged in `assets/art/SOURCES.md` with the model and the prompt.

**For every clip:** 16:9, 1080p, 6–8 seconds, a seamless loop if the model allows it (otherwise we cross-fade the ends), slow camera, no sound needed, no text, no people in the foreground, no modern logos or cars in frame. The grade should sit on our page: warm, slightly desaturated, cream highlights, deep burgundy-brown shadows, like an old photographic print.

Shared tail to append to each prompt:

> Cinematic, slow and calm camera move, natural light, warm desaturated colour grade with cream highlights and deep warm shadows, fine film grain, photorealistic, no text, no logos, no people in the foreground, 16:9, seamless loop.

| Stop | File name to return | Prompt |
| --- | --- | --- |
| Tenochtitlan (milestone 14) | `tour-cdmx.mp4` | Aerial view, very early morning, of the Zócalo in Mexico City: the Metropolitan Cathedral and the National Palace in soft mist, the empty square, the camera gliding slowly forward and rising. |
| The Andes (16) | `tour-andes.mp4` | The Andes at dawn above the Sacred Valley near Cuzco: terraced slopes, low cloud drifting through the valley, first light on the ridges, a slow lateral drift of the camera. |
| Valladolid / Salamanca (17) | `tour-patio.mp4` | A Renaissance cloister in golden Villamayor sandstone in the style of Salamanca: carved arches and medallions, a well in the centre, afternoon light moving slowly across the stone, swallows crossing the sky, the camera moving slowly along the gallery. |
| Rio de Janeiro (22) | `tour-rio.mp4` | The bay of Rio de Janeiro seen from the sea at first light: Sugarloaf Mountain and the green hills in haze, calm water, the camera moving slowly forward over the water. |
| Guadalupe Hidalgo (31) | `tour-desierto.mp4` | The Sonoran desert at dusk: saguaro cacti, low mountains in layers of haze, a pale sky turning rose, the camera tracking slowly sideways at ground level. |
| Philippines / 1898 (39) | `tour-habana.mp4` | Old Havana seen from the water at sunrise: the Malecón, colonial façades and the Castillo del Morro, gentle swell, the camera drifting slowly across the harbour mouth. |

The Atlantic crossing (9) and the Pacific (18) use public-domain works (Dióscoro Puebla, 1862; the galleon after González Cabrera Bueno, 1734). The opening, Vasconcelos (46), the Lusophone forums (57) and Iberofonía (60) have no clip and do not need one.

The soldiers (`assets/video/tercio-*`) and the Columns of Hercules loop already exist; they are scenes rather than places, so they stay off the tour.
