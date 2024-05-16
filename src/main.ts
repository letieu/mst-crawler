import Koa from "koa";
import { crawler, getUrl } from "./crawler.js";
import { bodyParser } from "@koa/bodyparser";
import cors from "@koa/cors";

const app = new Koa();
app.use(bodyParser());
app.use(cors())

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error(err)
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message
    };
  }
})

app.use(async function (ctx) {
  const body = ctx.request.body;
  const taxIds = body.taxIds;
  const type = body.type;

  if (crawler.running) {
    ctx.status = 400
    ctx.body = "Running before, please wait";
  } else {
    await crawler.run(taxIds.map((id: string) => getUrl(id, type)));
    const data = await crawler.exportData("default", "json");
    ctx.body = data
  }
});

app.listen(3000);
console.log("server started")
