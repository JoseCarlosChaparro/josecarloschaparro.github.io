# josechaparro.com, personal portfolio website

Source code for my personal portfolio site. Built with HTML, Tailwind CSS, and vanilla JS.

- Live site: [josechaparro.com](https://josechaparro.com)
- Resume PDF: [assets/cv/jose-chaparro-cv.pdf](assets/cv/jose-chaparro-cv.pdf)
- Resume LaTeX source: [docs/cv/cv_chaparro.tex](docs/cv/cv_chaparro.tex)

## Building

Tailwind CSS is compiled ahead of time; the site serves the result from
`assets/css/tailwind.css`. After changing classes in `index.html`, `app.js`
or the locale files, rebuild it:

```
npm install
npm run build:css
```

The resume PDF is built from the LaTeX source with `latexmk -pdf` and must
stay on one page; `python3 tools/cv_parse_check.py <pdf>` checks that it
extracts cleanly for applicant tracking systems.
