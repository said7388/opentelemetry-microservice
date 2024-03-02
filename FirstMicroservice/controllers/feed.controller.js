import { context, propagation, trace } from "@opentelemetry/api";
import axios from "axios";

export const getFeeds = async (req, res, next) => {
  const { id } = req.query;
  // Access the parent span from the request's context
  const parentSpan = trace.getSpan(context.active());

  try {
    if (parentSpan) {
      parentSpan.setAttribute("user.id", id);
    };

    const feedResponse = await context.with(
      trace.setSpan(context.active(), parentSpan),
      async () => {
        // Prepare headers for context injection
        const carrier = {};
        propagation.inject(context.active(), carrier);

        // Make the HTTP request with the injected context in headers
        return axios.get("http://localhost:4000/api/feeds", {
          headers: carrier,
        });
      }
    );

    const response = await fetch('http://localhost:4000/api/feeds');
    const data = await response.json();

    return res.status(200).json({
      message: 'Feeds fetched successfully',
      data: data.feeds
    });
  } catch (error) {
    if (parentSpan) {
      parentSpan.recordException(error);
    };

    return res.status(500).send(error.message);
  } finally {
    if (parentSpan) {
      parentSpan.end();
    }
  }
};