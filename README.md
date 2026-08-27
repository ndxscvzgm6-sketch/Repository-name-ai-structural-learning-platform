# MCAT Tracker — published site

This branch exists only to serve the app through GitHub Pages. It holds a
copy of `mcat-tracker/index.html` from the source branch, placed at the root
so the site URL is short.

**Live site:** https://ndxscvzgm6-sketch.github.io/Repository-name-ai-structural-learning-platform/

## Updating the published copy

Work on the app in `mcat-tracker/index.html` on the source branch, then copy
the finished file over the `index.html` here and push:

```bash
git checkout gh-pages
git checkout <source-branch> -- mcat-tracker/index.html
mv mcat-tracker/index.html index.html && rmdir mcat-tracker
git commit -am "Publish latest tracker" && git push
```

Progress is stored per browser, so publishing a new version never touches
anyone's saved progress.
