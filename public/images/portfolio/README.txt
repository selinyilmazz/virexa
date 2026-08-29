Hero portrait
-------------
Drop your photo here as exactly:

  portrait.jpg

(overwrite the existing file with this same name any time you want to
update it — no code change needed). Recommended: a vertical/portrait
crop, at least 900x1200px, JPG or high-quality photo.

Until a real portrait.jpg exists, the Hero section shows a designed
placeholder frame instead of a broken image, so the page always looks
intentional.

If you'd rather use a different filename or format (e.g. portrait.png),
update `portraitUrl` in src/data/portfolio.ts to match.

Site background
---------------
atmosphere.jpg is the full-page background photo for dark mode (see
src/app/portfolio/portfolio.css, `.portfolio-scope.dark`). Replace it
with a different image using the same filename to swap it, or change
the `background-image` url() there to point at a new file. Light mode
deliberately keeps a plain warm-paper background instead (a moody
dark photo doesn't suit it).
