import { PlaywrightCrawler } from "crawlee";
import { getCaptchaImage, getCompanyDetail } from "./evaluates.js";
import { resolveCaptcha } from "./captcha.js";

const baseUrl = "https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp";
const maxTries = 5; // Maximum number of tries to resolve captcha

export function getUrl(taxId: string) {
  return `${baseUrl}?taxId=${taxId}`;
}

function getTaxId(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.origin + urlObj.pathname === baseUrl) {
      return urlObj.searchParams.get("taxId");
    } else {
      throw new Error("URL does not match baseUrl");
    }
  } catch (error) {
    console.error("Invalid URL or URL does not match baseUrl:", error);
    return null;
  }
}

export const crawler = new PlaywrightCrawler({
  async requestHandler({ page, pushData }) {
    const taxId = getTaxId(page.url());
    if (!taxId) return;

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

  maxRequestsPerCrawl: 10,
  headless: false,
});
