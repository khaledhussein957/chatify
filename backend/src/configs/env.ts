import dotenv from "dotenv";

dotenv.config({ quiet: true });

const ENV = {
  MONGO_URI: process.env.MONGO_URI || "",
  PORT: process.env.PORT || "9000",

  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
};

export default ENV;
