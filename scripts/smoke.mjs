import { chromium } from "playwright";

const BASE = process.argv[2] || "https://voyagewiki.pages.dev";
const MOBILE = { width: 375, height: 667 };

const visited = new Set();
const queue = ["/"];
const issues = { overflow: [], consoleErrors: [], failedRequests: [] };

function pathOf(url) {
  try {
    const parsedUrl = new URL(url, BASE);
    if (parsedUrl.origin !== new URL(BASE).origin) return null;
    return parsedUrl.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

async function checkPage(page, route) {
  const consoleErrors = [];
  const failedRequests = [];
  const onConsole = (message) => { if (message.type() === "error") consoleErrors.push(message.text()); };
  const onRequestFailed = (request) => {
    const errorText = request.failure()?.errorText || "";
    // ERR_ABORTED is normal when navigation interrupts an in-flight resource, not a real failure.
    if (errorText.includes("ERR_ABORTED")) return;
    failedRequests.push(request.method() + " " + request.url() + " - " + errorText);
  };
  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);

  const response = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
  if (!response || !response.ok()) {
    issues.failedRequests.push({ route, detail: "nav returned " + (response?.status() ?? "no response") });
  }
  await page.waitForLoadState("domcontentloaded");

  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    if (docWidth <= viewportWidth + 1) return null;
    const offenders = [];
    document.querySelectorAll("*").forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.right > viewportWidth + 1 && bounds.width > 0) {
        offenders.push({
          tag: element.tagName.toLowerCase(),
          className: (element.className || "").toString().slice(0, 80),
          right: Math.round(bounds.right),
          text: (element.textContent || "").trim().slice(0, 60),
        });
      }
    });
    const unique = [];
    const seen = new Set();
    for (const offender of offenders) {
      const key = offender.tag + "." + offender.className;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(offender);
      if (unique.length >= 5) break;
    }
    return { docWidth, viewportWidth, offenders: unique };
  });
  if (overflow) issues.overflow.push({ route, ...overflow });
  if (consoleErrors.length > 0) issues.consoleErrors.push({ route, errors: consoleErrors });
  if (failedRequests.length > 0) issues.failedRequests.push({ route, requests: failedRequests });

  const newLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => anchor.getAttribute("href"))
      .filter((href) => href && !href.startsWith("http") && !href.startsWith("mailto:") && !href.startsWith("#"))
      .filter((href) => !/\.(py|json|md|mp3|svg|png|jpg|jpeg|webp|ico|pdf|zip)$/.test(href));
  });

  page.off("console", onConsole);
  page.off("requestfailed", onRequestFailed);

  for (const link of newLinks) {
    const path = pathOf(link);
    if (path && !visited.has(path) && !queue.includes(path)) queue.push(path);
  }
}

async function main() {
  console.log("Crawling " + BASE + " at mobile viewport " + MOBILE.width + "x" + MOBILE.height);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: MOBILE });
  const page = await context.newPage();

  let count = 0;
  while (queue.length > 0) {
    const route = queue.shift();
    if (visited.has(route)) continue;
    visited.add(route);
    count++;
    process.stdout.write(("\r  [" + count + "] " + route).padEnd(80, " "));
    try {
      await checkPage(page, route);
    } catch (error) {
      issues.failedRequests.push({ route, detail: error.message });
    }
  }
  console.log("");
  await browser.close();

  console.log("\n=== Crawled " + visited.size + " pages ===\n");

  console.log("Mobile overflow (>" + MOBILE.width + "px): " + issues.overflow.length + " pages affected");
  for (const pageOverflow of issues.overflow) {
    console.log("  " + pageOverflow.route + ": doc=" + pageOverflow.docWidth + "px (viewport " + pageOverflow.viewportWidth + "px)");
    for (const offender of pageOverflow.offenders) {
      console.log("    -> <" + offender.tag + " class=\"" + offender.className + "\"> right=" + offender.right + "px  text=" + JSON.stringify(offender.text));
    }
  }

  console.log("\nConsole errors: " + issues.consoleErrors.length + " pages affected");
  for (const pageErrors of issues.consoleErrors) {
    console.log("  " + pageErrors.route + ":");
    for (const message of pageErrors.errors) console.log("    " + message);
  }

  console.log("\nFailed requests: " + issues.failedRequests.length + " pages affected");
  for (const pageFailures of issues.failedRequests) {
    console.log("  " + pageFailures.route + ": " + JSON.stringify(pageFailures.requests || pageFailures.detail));
  }

  const total = issues.overflow.length + issues.consoleErrors.length + issues.failedRequests.length;
  process.exit(total > 0 ? 1 : 0);
}

main().catch((error) => { console.error(error); process.exit(2); });
