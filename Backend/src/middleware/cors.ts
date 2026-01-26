import cors from "cors";

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error("FRONTEND_URL is not set in environment variables");
      return callback(new Error("FRONTEND_URL not configured"));
    }

    const allowedOrigins = [
      frontendUrl,
      frontendUrl.endsWith("/") ? frontendUrl.slice(0, -1) : frontendUrl + "/", // Handle both with and without trailing slash
    ];

    console.log("CORS check - Origin:", origin);
    console.log("CORS check - Allowed origins:", allowedOrigins);
    console.log("CORS check - Frontend URL from env:", frontendUrl);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
    "Set-Cookie",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
