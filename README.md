# Ehi’s portfolio

Open this portfolio folder in Cursor or VS Code. The site uses editable HTML, CSS, and JavaScript with local original Figma assets. No package installation is needed; Node.js 20+ runs the development and build scripts.

## Editing and preview

Run `npm run dev`, then visit http://127.0.0.1:4173. Save changes and refresh.

- `index.html`: copy, cards, image layers.
- `styles.css`: layout, typography, responsive breakpoints.
- `app.js`: the `destinations` object connects your own contact, resume, Gallery and case-study URLs.
- `assets/`: original artwork and SVGs.

Run `npm run build` to create `dist/`. Stop the dev server with Control+C before running `npm run preview`, which serves that build on the same port. Relative URLs support GitHub Pages repository paths.

## GitHub Pages

1. Create an empty GitHub repository. Open this portfolio folder in your editor, initialize Git and push the files to the repository’s `main` branch.
2. In the repository, select Settings → Pages → GitHub Actions as the source.
3. The included `.github/workflows/pages.yml` publishes on pushes to main, or through a manual Actions run.
4. Wait for a successful workflow. Its deployment output contains your public URL.

See [GitHub’s official workflow instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). No repository was created and nothing was published in this task.

## Namecheap domain later

Once Pages works, add your domain in the repository’s Pages settings, then set the corresponding DNS records in Namecheap. Follow [GitHub’s current custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). No domain or DNS settings were changed.

## Remaining inputs and fidelity

This implements Figma file w1hBNlh3nunTnkYSLag5Vj, homepage node 144:3831. The hero uses the supplied original video, assets/hero.mp4, with muted autoplay, looping, inline playback, and the original still as its poster. Reduced-motion settings show the still instead.

The licensed Gelica, Söhne, and Departure Mono webfonts were not provided. Named CSS families use Georgia, Arial, and monospace fallbacks. Add licensed WOFF2 files and @font-face rules for an exact typography match.

Replace null destinations in app.js with your own email/social/resume paths. Work and Story navigate to existing homepage sections. Gallery and case-study pages are not built; their buttons show explicit notices instead of pretending those pages exist. No personal/contact information was invented.

The homepage uses one document scroll. On desktop the sidebar sticks in place as the work section reaches the top, while projects continue down the page. Mobile uses a single-column page. Keyboard focus, skip navigation, native dismissible dialogs and reduced-motion scrolling are included.
