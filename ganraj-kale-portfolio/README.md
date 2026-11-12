# Ganraj Kale Portfolio (Vercel)

Static site (`index.html`) + serverless email function (`api/enquiry.js`). No build step.

## Deploy on Vercel (5 steps)
1. **Resend account:** sign up at https://resend.com using **ddkale73@gmail.com** (important: with the free `onboarding@resend.dev` sender, Resend only delivers to the email you signed up with).
2. In Resend > API Keys, create a key (copy it, `re_...`).
3. Upload this folder to a GitHub repo, then on https://vercel.com: Add New > Project > import the repo > Deploy.
   (Or with CLI: `npm i -g vercel` then `vercel` inside this folder.)
4. Vercel > Project > Settings > Environment Variables: add `RESEND_API_KEY` = your key. Optionally `TO_EMAIL`, `FROM_EMAIL` (see `.env.example`). Then **Redeploy**.
5. Open your site, send a test enquiry. The email arrives at ddkale73@gmail.com; "Reply" goes to the visitor.

## Visitor analytics (real data)
Vercel > Project > Analytics > Enable (Web Analytics). The script is already in `index.html`. Numbers show in your private Vercel dashboard only (no fake counters on the site).

## Notes
- The key lives only in Vercel env vars, never in the frontend.
- If the function is unreachable, the form falls back to opening the visitor's email app or WhatsApp.
- Later, to send from your own domain (e.g. enquiry@yourdomain.com), verify the domain in Resend and set `FROM_EMAIL`.

## GFC AI chatbot
- The floating GFC button opens the chatbot; "GFC AI" in the menu (or `/#gfc-ai`) opens it as a full page.
- It works out of the box with built-in knowledge about Ganraj, projects, Ganraj Fruit Company, services, socials and contact details, and can take project enquiries (they go through `/api/enquiry` to your email).
- Optional Gemini upgrade for free-form questions: get a key at https://aistudio.google.com/apikey, add `GEMINI_API_KEY` in Vercel env vars, redeploy. Without it the bot silently uses the built-in answers.
- To change what the bot knows, edit the `KB` object at the bottom of `index.html` and the facts text in `api/chat.js`.

## Email troubleshooting (enquiry form + chatbot)
1. Open `https://YOUR-SITE.vercel.app/api/enquiry` in a browser. You should see `{"ok":true,"emailConfigured":true}`.
   - `emailConfigured:false` -> add `RESEND_API_KEY` in Vercel > Settings > Environment Variables, then **Redeploy** (env vars apply only to new deployments).
   - 404 -> the `api` folder was not uploaded at the project root.
2. Send a test enquiry. If it fails, open Vercel > Project > Logs and look for "Resend error". A 403 usually means the Resend account email is not ddkale73@gmail.com (free sender only delivers to the signup email).
3. Check Gmail Spam. Mail comes from `onboarding@resend.dev`.
