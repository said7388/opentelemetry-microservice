import { context, trace } from "@opentelemetry/api";
import configureOpenTelemetry from "../config/tracing.config.js";
const tracerProvider = configureOpenTelemetry("1st-microservice");

export const feedMiddleware = async (req, res, next) => {
  const tracer = tracerProvider.getTracer("feeds-tracer");
  const span = tracer.startSpan("newsfeed-span-1st-ms");

  // Add custom attributes or log additional information if needed
  span.setAttribute("feeds", "Feed tracking");

  // Pass the span to the request object for use in the route handler
  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
};