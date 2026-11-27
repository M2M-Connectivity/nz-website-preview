# M2M One NZ — encrypted team preview

This package is aligned with the existing `nz-website-preview` GitHub Pages repository. It preserves the shared password, AES-GCM/PBKDF2 encryption, session unlock, service-worker transitions, `.nojekyll`, robots exclusion and `/nz-website-preview/` URL base.

## Update the existing Git repository

Copy the **contents** of this folder into your existing repository root, replacing matching files. Keep your existing `.git` directory. Do not create another nested `nz-website-preview` folder. Commit and push normally. No build step is needed for GitHub Pages.

The ZIP intentionally excludes `.git`, macOS resource files, credentials and unencrypted website source. Do not upload an extracted maintenance archive to the public preview repository.

## Included update

16 encrypted pages: all 13 public sitemap destinations, plus catalogue, demo CMS and 404 route. Updated navigation, expanded onboarding forms, partner enquiries, hardware guidance, coverage links, Privacy and Terms reference pages. Pricing and customer stories retain their documented content limitations.

The customer-journey audit requested after the sitemap release has not been completed. This package contains the tested sitemap-aligned release, not an unverified claim of completed end-to-end production journeys.

## Email and CMS boundaries

GitHub Pages is static. Forms validate inputs and show an explicit delivery-not-connected message without sending to a nonexistent GitHub API. Configure and deploy the included Node/Resend source separately to enable email; never put an API key in this repository. CMS changes and uploads remain browser-local demo data, not shared production content.

## Restore the static site

Run using Bash and Node.js. The password is entered silently and is not stored in the repository.

```bash
mkdir restored-site
read -rs -p 'Team password: ' preview_password
printf '%s' "$preview_password" | node maintenance/unpack.cjs | tar xz -C restored-site
unset preview_password
```

## Restore the full editable project and Resend server

```bash
mkdir restored-project
read -rs -p 'Team password: ' preview_password
printf '%s' "$preview_password" | node maintenance/unpack-project.cjs | tar xz -C restored-project
unset preview_password
cd restored-project
npm run build
npm test
```

See the restored project's README and `.env.example` for Node hosting and Resend configuration. The original static source restoration command remains supported.

## Rebuild this encrypted preview

After editing and committing the restored source project, run from this preview repository:

```bash
read -rs -p 'Team password: ' preview_password
printf '%s' "$preview_password" | node maintenance/repack.cjs /absolute/path/to/restored-project
unset preview_password
```

This checks the password before updating output, rewrites internal paths for GitHub Pages, embeds assets inside encrypted pages, refreshes both encrypted maintenance archives, and verifies decryption roundtrips. It never writes the password into a file. Keep the repository's deployment path unchanged unless you also update the preview wrapper and repack script.
