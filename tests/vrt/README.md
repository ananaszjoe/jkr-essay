# Component catalog visual regression

The visual-regression fixture is the static `#components` route. It uses the same production components while avoiding application state, timers, and graph behavior.

Install Chromium once:

```sh
npm run test:vrt:install
```

Create or intentionally update the desktop and mobile baselines:

```sh
npm run test:vrt:update
```

Compare the current UI with the committed baselines:

```sh
npm run test:vrt
```

Baseline PNGs are stored under `tests/vrt/__screenshots__/` and should be reviewed before committing. Update them only when a visual change is intentional.
