// zod 4 removed `required_error`. This keeps the old behavior: the custom
// message is used only when the field is missing; other issues (e.g. wrong
// type) keep zod's default message.
export const requiredError = (message: string) => ({
  error: (issue: { input?: unknown }) =>
    issue.input === undefined ? message : undefined,
});
