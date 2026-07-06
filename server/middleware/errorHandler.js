/**
 * MedFlow AI - Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("[MedFlow Error]", err.stack || err.message || err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
