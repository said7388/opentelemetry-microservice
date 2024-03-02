import { context, propagation, trace } from "@opentelemetry/api";
import axios from "axios";

export const getFeeds = async (req, res, next) => {
  const { id } = req.query;
  // Access the parent span from the request's context
  const parentSpan = trace.getSpan(context.active());

  try {
    if (parentSpan) {
      parentSpan.setAttribute("user.id", id);
      console.log("parentSpan", parentSpan)
    };

    const feedResponse = await context.with(
      trace.setSpan(context.active(), parentSpan),
      async () => {
        // Prepare headers for context injection
        const carrier = {};
        propagation.inject(context.active(), carrier);

        // Make the HTTP request with the injected context in headers
        return axios.get("http://47.129.30.41:4000/api/feeds", {
          headers: carrier,
        });
      }
    );

    // const response = await fetch('http://localhost:4000/api/feeds');
    // const data = await response.json();

    return res.status(200).json({
      message: 'Feeds fetched successfully',
      data: feedResponse.data.feeds
    });
  } catch (error) {
    console.log("error happens", error)
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


////// IMPROVED getFeeds API ///////

// export const getFeeds = async (req, res, next) => {
//   const { id } = req.query;
//   const parentSpan = trace.getSpan(context.active());

//   try {
//     if (parentSpan) {
//       parentSpan.setAttribute("user.id", id);
//     }

//     const feedResponse = await context.with(trace.setSpan(context.active(), parentSpan), async () => {
//       const childSpan = trace.getTracer('your-service-name').startSpan('fetch-feeds');
//       childSpan.setAttribute('http.method', 'GET');
//       childSpan.setAttribute('http.url', 'http://localhost:4000/api/feeds');

//       try {
//         const response = await axios.get("http://localhost:4000/api/feeds");
//         childSpan.setAttribute('http.status_code', response.status);
//         return response.data;
//       } catch (error) {
//         childSpan.recordException(error);
//         throw error;
//       } finally {
//         childSpan.end();
//       }
//     });

//     return res.status(200).json({
//       message: 'Feeds fetched successfully',
//       data: feedResponse.feeds
//     });
//   } catch (error) {
//     if (parentSpan) {
//       parentSpan.recordException(error);
//     }
//     return res.status(500).send(error.message);
//   } finally {
//     if (parentSpan) {
//       parentSpan.end();
//     }
//   }
// };
