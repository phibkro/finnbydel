import * as Sentry from "@sentry/bun";

// Sentry init — gracefully no-ops when SENTRY_DSN is unset so this
// can be imported unconditionally from the entry point. When the
// operator provisions a Sentry project + sets SENTRY_DSN at
// runtime, the SDK initializes and starts reporting.

const dsn = process.env.SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV ?? "production",
		tracesSampleRate: 0.1,
	});
}
