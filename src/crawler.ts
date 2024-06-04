import { Configuration, PlaywrightCrawler } from "crawlee";
import { getCaptchaImage, getCompanyDetail } from "./evaluates.js";
import { resolveCaptcha } from "./captcha.js";

const config = new Configuration({
  persistStorage: false,
});

const baseUrls: Record<number, string> = {
  1: "https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp",
  2: "https://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp",
};

const maxTries = 20; // Maximum number of tries to resolve captcha

export function getUrl(taxId: string, type: number, isAll: boolean) {
  return `${baseUrls[type]}?taxId=${taxId}&isAll=${isAll}`;
}

function getTaxId(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("taxId");
  } catch (error) {
    console.error("Invalid URL or URL does not match baseUrl:", error);
    return null;
  }
}


function getIsAll(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("isAll") === 'true'
  } catch (error) {
    console.error("Invalid URL or URL does not match baseUrl:", error);
    return false;
  }
}

function getType(url: string) {
  if (url.includes("mstdn")) return 1;
  if (url.includes("mstcn")) return 2;

  return undefined;
}

export function newCrawler(pushData: (data: any) => void) {
  return new PlaywrightCrawler(
    {
      async requestHandler({ request, page }) {
        const pageUrl = request.url;
        console.log(pageUrl);

        const taxId = getTaxId(pageUrl);
        const type = getType(pageUrl);
        const isAll = getIsAll(pageUrl);

        if (!type) return;
        if (!taxId) return;

        if (type == 1) {
          // Fill the "Mã số thuế"
          await page.fill('input[name="mst"]', taxId);
        } else {
          // Fill the "Căn cước"
          await page.fill('input[name="cmt2"]', taxId);
        }

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
          console.log(`Try: ${tries}`);
        } while (captchaFailed && tries < maxTries);

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

        console.log(`${pageUrl} Found: ${detailLinks.length}`);
        for (const detailLink of [...detailLinks]) {
          const match = detailLink.match(/javascript:submitform\('(.+)'\)/);
          if (!match) return;

          await page.click(`a[href="${detailLink}"]`)

          await new Promise((res) => setTimeout(res, 300));

          const res = await page.evaluate(getCompanyDetail);

          pushData({
            ...res,
            input: taxId,
          });

          await page.goBack()
          await new Promise((res) => setTimeout(res, 300));

          if (!isAll) {
            break;
          }
        }
      },

      maxRequestsPerCrawl: 100000000,
      maxConcurrency: 1,
      //headless: false,
    },
    config
  );
}
