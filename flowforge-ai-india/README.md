# FlowForge AI

FlowForge AI is an explainable business process automation planner for Indian businesses. It helps teams identify which repetitive workflows are worth automating, estimates the return in INR, recommends a practical tool stack, and creates a 30-day pilot roadmap.

## Why this project

Teams often adopt automation because a process *feels* repetitive, without measuring its volume, rule consistency, exception rate, integration complexity, or likely payback. FlowForge AI turns those inputs into an auditable recommendation instead of a black-box answer.

## Features

- Automation readiness score with a plain-language verdict
- Monthly hours and cost savings estimate
- Pilot cost, payback period, and implementation risk
- Recommendations tailored to six business process categories
- 30-day implementation roadmap with human-review guardrails
- Persistent assessment history with delete and revisit actions
- Responsive light/dark interface
- Animated workflow illustration and savings chart
- REST API, input validation, and zero production dependencies

## Tech stack

- Frontend: semantic HTML, CSS, and modern browser JavaScript
- Backend: Node.js HTTP server and REST API
- Storage: JSON file persistence (easy to replace with PostgreSQL or MongoDB)
- Tests: Node's built-in test runner

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

Run the tests:

```bash
npm test
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/assessments` | List recent assessments |
| `POST` | `/api/assessments` | Analyze and save a process |
| `DELETE` | `/api/assessments/:id` | Delete an assessment |

## Scoring approach

The readiness score is intentionally explainable. It combines process category, monthly volume, rule consistency, digital-input readiness, and exception rate. ROI is estimated from time per run, people involved, hourly cost in INR, and the score-derived automation rate. Pilot cost is a heuristic estimate in INR, not a market quote. Values are directional planning estimates rather than financial guarantees.

## Future improvements

- Team accounts and role-based access
- PostgreSQL persistence and audit logs
- CSV/PDF report export
- Process diagram import
- LLM-assisted workflow discovery with protected business data

## License

MIT
