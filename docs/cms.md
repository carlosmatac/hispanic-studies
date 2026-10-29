# The CMS: how Beltrán edits the archive (issue #69)

The archive's works are files in the repository (`site/content/archive/<id>.md`:
the record on top, the full text below). **Keystatic** (keystatic.com, MIT) is
an editor for exactly those files, at **`/keystatic`** on the site. Nothing is
stored anywhere else: every save is a change to a file in the repo.

- **Locally** (`npm run dev`, then http://localhost:3000/keystatic) it writes
  the files on disk. Use it to try things; commit the result as usual.
- **On the deployed site** it saves through GitHub: each save is a commit to
  the repository, and Vercel redeploys the site with it (a minute or two).
  This mode needs the setup below, which is not done yet.

On a deployment without that setup, `/keystatic` answers 404 (`site/proxy.ts`).
It is never indexed (robots.txt, `X-Robots-Tag`, `noindex`), and the preview
password (`SITE_PASSWORD`) does not stand in front of it: it has its own login.

## For Beltrán: adding or editing a text

1. Go to `https://<the site>/keystatic` and sign in with GitHub.
2. Open **Archive of Hispanic thought**. Every work is listed; search by title.
3. **To edit** a work, open it, change what you need, press **Save**.
4. **To add** a work, press **Add**. Fill in the title, author, year, period,
   region (the colour of its card) and the rights:
   - *Public domain*: paste the full text in the big field, in its original
     language. Use **Heading 2** for chapters: they become the contents. Fill in
     the *Source* fields (the edition you copied it from, its address).
   - *In copyright*: leave the text empty and add **links to legitimate copies**
     (publisher, library, Internet Archive lending). Never a pirated PDF.
   - *Not yet checked*: leave the text empty until the rights are clear.
   The **Address (id)** is made from the title; leave it once the work is published,
   because links point at it.
5. Press **Save**. The site shows the change after the next deploy (a minute or two).

Questions of rights (is it in the public domain? is this the original text?)
are in `docs/archive-sources.md`.

## What happens on save

GitHub mode: Keystatic commits the changed file, with Beltrán as the author, to
the branch chosen at the top of the editor (`main` by default). Vercel sees the
commit and builds the site; the reader page and the archive's card update.
Keystatic writes the YAML on top in its own style (no quotes, long lines
folded); that is expected.

**A decision for Carlos**: AGENTS.md says nothing reaches `main` without a pull
request. Content saved from the CMS is the exception we propose (only
`site/content/archive/` changes, and Beltrán will not open PRs). If you prefer
review, protect `main` and Beltrán works on a branch: the editor can create one
(its name starts with `content/`, `branchPrefix` in `keystatic.config.ts`) and
open a pull request from it.

## Setting up GitHub mode (Carlos, once)

What we need from Beltrán: **a GitHub account** (his username).

1. On GitHub, add Beltrán to `carlosmatac/hispanic-studies` as a collaborator
   with **Write** access (Keystatic acts with his own permissions).
2. Create the GitHub App. The easy way is Keystatic's own wizard, locally:
   ```bash
   cd site
   NEXT_PUBLIC_KEYSTATIC_STORAGE=github npm run dev
   # open http://localhost:3000/keystatic → "Create GitHub App"
   ```
   It creates the app under your account and writes these to `site/.env`
   (never commit it):
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
   `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
3. **Install** the app on the repository `carlosmatac/hispanic-studies` only
   (GitHub → Settings → Developer settings → GitHub Apps → the app → Install).
4. In the app's settings, add the **callback URLs** of every place Beltrán will
   use the editor: `https://<production domain>/api/keystatic/github/oauth/callback`
   (and the preview domain if he edits there; localhost is added by the wizard).
5. In **Vercel** → Project → Settings → Environment Variables (Production, and
   Preview if wanted), add the four variables above plus
   `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`. Optional:
   `NEXT_PUBLIC_KEYSTATIC_REPO=owner/name` if the repository moves (default
   `carlosmatac/hispanic-studies`). Redeploy.
6. Open `/keystatic` on the site, sign in, save a harmless change, check the
   commit and the redeploy.

## Where things are

- Schema (the fields of a work): `site/keystatic.config.ts`
- Admin routes: `site/app/keystatic/`, `site/app/api/keystatic/`
- Who may reach it: `site/proxy.ts`
- How the site reads the files: `site/lib/archive.ts`
- Importing a text from Wikisource: `tools/ingest-wikisource.py`

Known quirk: the *Year* field shows a thousands separator ("1,891") while you
type; it is saved as the number 1891.
