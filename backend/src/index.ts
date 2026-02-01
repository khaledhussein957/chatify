import Express from "express";

const app = Express();

const starServer = () => {
  app.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
  });
};

starServer();