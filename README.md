# M2M One NZ website prototype

[Open the team preview](https://m2m-connectivity.github.io/nz-website-preview/). Enter the shared team password. The browser retains the unlock key for the tab session.

The encrypted maintenance archive contains the original delivered HTML, scripts, styles, fonts and images for all 13 prototype pages. To restore the static site into a new folder, run from this repository using Bash and Node.js:

```bash
mkdir restored-site
read -rs -p 'Team password: ' preview_password
printf '%s' "$preview_password" | node maintenance/unpack.cjs | tar xz -C restored-site
unset preview_password
```

Serve the restored folder at the root of a local web server. The prototype CMS stores demonstration changes in the browser.
