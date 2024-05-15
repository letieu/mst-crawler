import Koa from "koa";
import { crawler, getUrl } from "./crawler.js";
import { bodyParser } from "@koa/bodyparser";

const app = new Koa();
app.use(bodyParser());

app.use(async function (ctx) {
  const body = ctx.request.body;
  const taxIds = body.taxIds;

  console.log(taxIds);

  if (crawler.running) {
    ctx.body = "Running before, please wait";
  } else {
    await crawler.run(taxIds.map((id: string) => getUrl(id)));
    const data = await crawler.exportData("default", "csv");
    ctx.body = data
  }
});

app.listen(3000);

//crawler.run([getUrl("0316624050"), getUrl("0110481627")]);
