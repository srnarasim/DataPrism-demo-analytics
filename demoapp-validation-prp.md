# DemoApp Validation PRP Template

This Product Requirements Prompt (PRP) specifies the **test and validation criteria** for the *decoupled* **DataPrism Demo Analytics App** ("DemoApp").  It ensures the application operates correctly while loading **all DataPrism bundles, plugins, and assets exclusively from a CDN**.

---

## 1. Objective

Validate that the decoupled DemoApp:

1. Reliably loads every DataPrism asset from the configured CDN.
2. Initializes without accessing any local DataPrism code.
3. Performs all core workflows (data import → analysis → visualization → LLM interaction → export) across supported browsers and devices.
4. Meets performance, security, and usability benchmarks.

---

## 2. Scope

- **Resources**: JavaScript, WASM, CSS, plugins, and config files served from the CDN.
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.
- **Devices**: Desktop (Windows/macOS/Linux), Tablet, Mobile.
- **Environments**: Development, Staging, Production CDNs.

---

## 3. Functional Validation Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **F-01** | **CDN Asset Retrieval** | All network requests for DataPrism bundles hit the CDN origin; 0 local/relative paths. |
| **F-02** | **Integrity Verification** | Assets with SRI hashes pass integrity checks; failures block execution and surface clear errors. |
| **F-03** | **Initialization** | `window.DataPrism.init()` resolves successfully within 3 s, returning a ready state with all plugins registered. |
| **F-04** | **Workflow – Import** | DemoApp imports a 100 k-row CSV via `csv-importer` plugin without JavaScript errors. |
| **F-05** | **Workflow – Visualize** | At least two chart types render (e.g., bar, scatter) using `observable-charts` plugin. |
| **F-06** | **Workflow – LLM** | `openai-llm` plugin returns label suggestions; DemoApp applies them to the dataset. |
| **F-07** | **Workflow – Export** | Labeled dataset exports to CSV and downloads successfully. |
| **F-08** | **Error Handling** | If a CDN asset returns 404/500, DemoApp shows a non-blocking error banner and disables dependent features gracefully. |

---

## 4. Performance & Reliability Requirements

| ID | Metric | Target |
|----|--------|--------|
| **P-01** | First Contentful Paint (FCP) | < 2 s broadband, < 5 s 3G. |
| **P-02** | Total Bundle Download | < 8 MB compressed. |
| **P-03** | WASM Compile + Init | < 1.5 s on desktop, < 3 s mobile. |
| **P-04** | 95th-percentile API Latency (LLM) | < 1 s (excluding network). |
| **P-05** | Asset Cache-Hit Ratio | ≥ 95 % for versioned assets. |

---

## 5. Security Requirements

1. **HTTPS-only** requests; mixed-content blocked.
2. **SRI** for all `<script>` and `<link>` CDN tags where practical.
3. **Content Security Policy** headers:
   ```
   script-src 'self' https://cdn.example.com;
   connect-src 'self' https://api.openai.com;
   worker-src 'self';
   ```
4. No secrets hard-coded in the client; all keys pulled from environment variables during build.

---

## 6. Automated Test Suite

| Layer | Tooling | Key Tests |
|-------|---------|----------|
| **Unit** | Jest / Vitest | CDN loader helpers, config parsers. |
| **Integration** | Playwright / Cypress | Bundle load success, init sequence, plugin registration. |
| **E2E** | Playwright / Cypress | Full user journeys (F-04 → F-07). |
| **Performance** | Lighthouse CI | P-01 – P-03 budgets. |
| **Security** | Snyk / npm-audit | Dependency vulnerability scan. |

All tests must execute in CI on every PR and main-branch push.  Failing tests **block the merge**.

---

## 7. Manual QA Checklist

- [ ] Verify all DataPrism URLs point to CDN domain.
- [ ] Pull CDN offline → App shows graceful degradation per **F-08**.
- [ ] Test on iOS Safari & Android Chrome.
- [ ] Toggle dark/light mode: charts and UI stay legible.
- [ ] Screen-reader audit passes for primary workflows.

---

## 8. Monitoring & Alerting

| Item | Solution | Threshold |
|------|----------|-----------|
| **Asset 4xx/5xx** | CDN logs → Grafana alert | ≥ 1 % in 5 min window. |
| **Init Failures** | Browser RUM | > 0.5 % session errors. |
| **Perf Regression** | Lighthouse-CI cron | P-01 exceeds +20 %. |

---

## 9. Deliverables

1. **Automated test scripts** committed under `tests/`.
2. **CI workflow** (`.github/workflows/ci.yml`) running all tests & Lighthouse budgets.
3. **QA checklist** in `/docs/qa-manual.md`.
4. **Monitoring dashboards** (Grafana/Datadog) with associated alert rules.
5. **Validation report** template (`/docs/validation-report.md`).

---

## 10. Success Criteria

- 100 % of tests pass in CI for three consecutive main-branch builds.
- Manual QA checklist completed with no critical defects.
- CDN asset availability ≥ 99.9 % over 7 days post-deployment.
- Performance metrics (P-01 → P-05) meet or exceed targets.

---

## 11. How to Use This PRP

1. Copy this file to `/PRPs/demoapp-validation.md` in the DemoApp repo.
2. Adjust CDN domain, tooling, or thresholds as project specifics evolve.
3. Submit to context-engineering workflow: `/generate-prp demoapp-validation.md`.
4. Implement the resulting plan; iterate until all success criteria are met.
