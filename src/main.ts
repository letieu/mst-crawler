import express from "express";
import { getUrl, newCrawler } from "./crawler.js";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

app.use(bodyParser.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.post("/", (req, res) => {
  try {
    const { taxIds, type } = req.body;
    const result: any[] = [];

    const crawler = newCrawler((data) => result.push(data));

    crawler
      .run(
        taxIds.map((id: string) => ({
          url: getUrl(id, type),
          uniqueKey: `${id}-${Date.now()}`,
        }))
      )
      .then(() => res.json(result));
  } catch (e: any) {
    res.statusCode = 400;
    res.send(e);
  }
});

app.listen(3000, () => {
  console.log("server started");
});
