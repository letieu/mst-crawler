export const getCaptchaImage = async () => {
  const c = document.createElement("canvas");
  const img = document.querySelector(
    "form > table > tbody > tr:nth-child(6) > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > div > img"
  ) as HTMLImageElement;
  c.height = img.naturalHeight;
  c.width = img.naturalWidth;
  const ctx = c.getContext("2d");

  ctx?.drawImage(img, 0, 0, c.width, c.height);
  const base64String = c.toDataURL();
  return base64String;
};

export const getCompanyDetail = (isAll: boolean) => {
  const data: any = {};

  // Get the table element
  const table = document.querySelector(".ta_border");

  // Get all table rows
  const rows = table?.querySelectorAll("tbody tr");

  // Iterate over each table row
  rows?.forEach(function(row) {
    const cells = row.querySelectorAll("th, td");

    // Iterate over each cell in the row
    for (let i = 0; i < cells.length; i += 2) {
      // Step by 2 to handle key-value pairs
      const key = cells[i]?.textContent?.trim();
      let value = cells[i + 1]?.textContent?.trim();

      // Remove any extra whitespace and line breaks
      value = value?.replace(/\s+/g, " ");

      if (!key) continue;

      // Store key-value pairs in the data object
      data[key] = value;

      if (!isAll) break; // get only first item
    }
  });

  return data;
};
