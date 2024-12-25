const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Scrape function
async function scrapePage(url, selectors) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "load", timeout: 0 });

    const result = await page.evaluate((selectors) => {
      const scrapedData = {};

      const heading =
        document.querySelector(selectors.heading)?.innerText || "";

      const paragraphElements = document.querySelectorAll(selectors.paragraphs);
      const paragraphs = Array.from(paragraphElements)
        .map((p) => p.innerText.trim())
        .filter((p) => p.length > 0);

      const listItemElements = document.querySelectorAll(selectors.listItems);
      const listItems = Array.from(listItemElements)
        .map((li) => li.innerText.trim())
        .filter((li) => li.length > 0);

      const linkElements = document.querySelectorAll(selectors.links);
      const links = Array.from(linkElements)
        .map((a) => a.innerText.trim())
        .filter((a) => a.length > 0);

      scrapedData.heading = heading;
      scrapedData.paragraphs = paragraphs;
      scrapedData.listItems = listItems;
      scrapedData.links = links;

      return scrapedData;
    }, selectors);

    return { url, data: result };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { url, error: error.message };
  } finally {
    await browser.close();
  }
}

// POST API to scrape data from a given URL
app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const selectors = {
    heading: "h1",
    paragraphs: "p",
    listItems: "ul li",
    links: "a",
  };

  try {
    const result = await scrapePage(url, selectors);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred during scraping" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
