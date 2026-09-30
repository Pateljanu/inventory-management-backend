// Shared 429 responder so rate-limit rejections use the standard error envelope.
export const rateLimitHandler = (code, message) => (req, res, _next, options) => {
  res.status(options.statusCode).json({ success: false, error: { code, message, requestId: req.id } });
};
