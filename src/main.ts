import { Dictionary, PlaywrightCrawler } from "crawlee";
import { getCaptchaImage, getCompanyDetail } from "./evaluates.js";
import { resolveCaptcha } from "./captcha.js";

  const maxTries = 5; // Maximum number of tries to resolve captcha
  const taxId = "0316624050"; // Example Tax Identification Number

  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, pushData }) {
      await page.waitForSelector('form[name="myform"]');

      // Fill the "Mã số thuế"
      await page.fill('input[name="mst"]', taxId);

      let tries = 0;
      let captchaFailed = false;

      do {
        const captchaImage = await page.evaluate(getCaptchaImage);
        const captchaRes = await resolveCaptcha(captchaImage);
        await page.fill('input[name="captcha"]', captchaRes);

        await page.locator(".subBtn").click();

        await new Promise((res) => setTimeout(res, 500));

        captchaFailed = await page.evaluate(() => {
          const e = document.querySelector(
            'p[style="color:red;"]'
          ) as HTMLParagraphElement;
          return e?.innerText === "Vui lòng nhập đúng mã xác nhận!";
        });

        tries++;
      } while (captchaFailed && tries < maxTries);

      console.log(`Try: ${tries}`);

      if (captchaFailed) {
        console.log("Failed to resolve captcha after maximum tries.");
        return; // Exit requestHandler if captcha resolution fails after max tries
      }

      await page.locator(".subBtn").click();

      await new Promise((res) => setTimeout(res, 300));

      const detailLinks = await page.$$eval(
        "table.ta_border tr td:nth-child(3) > a",
        (links: HTMLLinkElement[]) => links.map((link) => link.href)
      );

      for (const detailLink of detailLinks) {
        const match = detailLink.match(/javascript:submitform\('(.+)'\)/);
        if (!match) return;

        const formParam = match[1];

        await page.evaluate((param) => {
          // @ts-ignore
          submitform(param);
        }, formParam);

        await new Promise((res) => setTimeout(res, 300));

        const res = await page.evaluate(getCompanyDetail);

        pushData(res);

        await page.goBack();
      }
    },

    maxRequestsPerCrawl: 20,
    // Uncomment this option to see the browser window.
    //headless: false,
  });

  await crawler.run(["https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp"]);
