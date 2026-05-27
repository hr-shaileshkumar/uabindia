# Notification Flow

## Frontend event contract
The UI uses browser custom events for centralized notifications:
- `erp:notify` for app-level messages
- `erp:api-error` for API interceptor errors

Payload shape:
- `variant`: `success | error | warning | info`
- `title`
- `message`
- `durationMs` (optional)

## Source APIs
Use helper functions from `frontend/src/lib/notifications.ts`:
- `notifySuccess`
- `notifyError`
- `notifyWarning`
- `notifyInfo`

## UX standards
- Validation failure: toast + actionable message.
- API failure: toast with stable wording; avoid raw stack traces.
- Success actions: concise confirmation only.
- Avoid duplicate/stacked spam messages on rapid clicks.

## QA checks
- Trigger each variant and verify rendering + auto-dismiss.
- Verify close button dismisses immediately.
- Verify API error events render request-failed/server-issue titles correctly.
