import { context, propagation, trace } from "@opentelemetry/api";
import configureOpenTelemetry from "../config/tracing.config.js";
const tracerProvider = configureOpenTelemetry("2nd-microservice");

// export const checkContext = async (req, res, next) => {
//   const ctx = propagation.extract(context.active(), req.headers); // Extract context from incoming request headers
//   const tracer = trace.getTracer("express-tracer");
//   console.log("Incoming request headers:", req.headers);
//   console.log(
//     "Extracted span from context:",
//     trace.getSpan(ctx)?.spanContext()
//   ); // Retrieve span from extracted context

//   const span = tracer.startSpan(
//     "validate-user",
//     {
//       attributes: { "http.method": "GET", "http.url": req.url },
//     },
//     ctx
//   );
//   span.end();

//   next();
// }

export const checkContext = async (req, res, next) => {
  const ctx = propagation.extract(context.active(), req.headers); // Extract context from incoming request headers
  const tracer = trace.getTracer("newsfeed-span");
  console.log("Incoming request headers:", req.headers);
  console.log(
    "Extracted span from context:",
    trace.getSpan(ctx)?.spanContext()
  ); // Retrieve span from extracted context

  const span = tracer.startSpan(
    "nesfeed-span-2nd-ms",
    {
      attributes: { "http.method": "GET", "http.url": req.url },
    },
    ctx
  );
  span.end();

  next();
}

