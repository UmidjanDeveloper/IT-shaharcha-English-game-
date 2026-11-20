<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/eb4626ce-b410-44c1-81e2-b23804942068

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies with `npm ci`.
2. Start the app with `npm run dev`.

### Optional AI tutor and voice

Speaking Studio and mini-mock Writing can request feedback in Uzbek or English. Set the server variables below in a local `.env.local` or in the project's Vercel Environment Variables. Restart the dev server or redeploy after changing them.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables feedback through the OpenAI Responses API |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `ELEVENLABS_API_KEY` | Enables ElevenLabs speech with a configured voice |
| `ELEVENLABS_VOICE_ID` | Voice from your ElevenLabs account |
| `ELEVENLABS_MODEL` | Defaults to `eleven_v3`. Language availability depends on the model and voice |

Keep these credentials server-side. The browser calls `/api/tutor`. Vercel serves this as a function, and the local Vite server serves the same handler. A static-only host needs an equivalent server endpoint. Feedback sends the selected exercise and written answer on request. Playback sends the chosen text to ElevenLabs. The built-in exercises also work without provider credentials.
