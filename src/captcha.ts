import "dotenv/config";

export async function resolveCaptcha(image: string): Promise<string> {
  const res = await fetch(`https://api.capsolver.com/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientKey: process.env.CAP_SOLVER_KEY,
      task: {
        module: "common",
        type: "ImageToTextTask",
        body: image,
      },
    }),
  });

  if (!res.ok) {
    throw new Error("Cannot resolve captcha");
  }

  const data = await res.json();
  return data?.solution?.text;
}
