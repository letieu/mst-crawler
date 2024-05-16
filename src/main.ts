import Koa from "koa";
import { getUrl, newCrawler } from "./crawler.js";
import { bodyParser } from "@koa/bodyparser";
import cors from "@koa/cors";

const app = new Koa();
app.use(bodyParser());
app.use(cors());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error(err);
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message,
    };
  }
});

app.use(async function (ctx) {
  const body = ctx.request.body;
  const taxIds = body.taxIds;
  const type = body.type;

  const result: any[] = [];

  const crawler = newCrawler((data) => result.push(data));

  await crawler.run(
    taxIds.map((id: string) => ({
      url: getUrl(id, type),
      uniqueKey: `${id}-${Date.now()}`,
    }))
  );

  await new Promise((res) => setTimeout(res, 2_000));

  ctx.body = result;
});

app.listen(3000);
console.log("server started");
