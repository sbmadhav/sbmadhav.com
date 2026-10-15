## What and why

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

- [ ] Checks pass: `python3 scripts/check-tokens.py` and `python3 site-build.py --out /tmp/site`
- [ ] Behavior changes update or add the matching Playwright test in `e2e/`, and `npx playwright test` passes
- [ ] Tokens only, no raw hex
- [ ] Tested in Daybreak (light) and Deep Space (dark), kid mode, and at 390px wide
- [ ] No changes to home page copy
- [ ] New repo-only files are in `exclude` in `_config.yml`
- [ ] No em dashes in anything I wrote
- [ ] I agree my contribution is licensed under the MIT License (see CONTRIBUTING.md)
