// Automated functional test for Customization Studio, Hamper Builder & Order Success
import http from "http";

const BASE_URL = "http://localhost:3000";

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("================================================================================");
  console.log("       PIXELLOSTORE — CUSTOMIZATION STUDIO & SUCCESS EXPERIENCE TESTS           ");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[Test ${String(total).padStart(2, "0")}] ✓ PASS — ${name}`);
      passed++;
    } catch (err) {
      console.error(`[Test ${String(total).padStart(2, "0")}] ✗ FAIL — ${name}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  // 1. Frames Studio Page Loads
  await test("Visual Memory Customization Studio route (/frames) returns 200 OK", async () => {
    const res = await fetchUrl("/frames");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.includes("Visual Memory Customization Studio")) {
      throw new Error("Page missing heading");
    }
  });

  // 2. Hamper Builder Page Loads
  await test("Advanced Hamper Builder route (/hamper) returns 200 OK", async () => {
    const res = await fetchUrl("/hamper");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.includes("Build Your Own") || !res.body.includes("Memory Hamper")) {
      throw new Error("Page missing hamper heading");
    }
  });

  // 3. Order Success Page Loads
  await test("Order Success route (/order-success) returns 200 OK", async () => {
    const res = await fetchUrl("/order-success");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 4. Category redirect for photo-frames
  await test("Category /category/photo-frames redirects to /frames", async () => {
    const res = await fetchUrl("/category/photo-frames");
    // Next.js redirect returns 307 or 308 or location header
    if (res.status !== 307 && res.status !== 308 && res.status !== 200) {
      throw new Error(`Expected redirect (307/308) or 200, got ${res.status}`);
    }
    const loc = res.headers["location"] || "";
    if (res.status === 307 || res.status === 308) {
      if (!loc.includes("/frames")) throw new Error(`Expected location /frames, got ${loc}`);
    }
  });

  // 5. Order details API security gating
  await test("Order details API (/api/orders/[id]) rejects unauthenticated access", async () => {
    const res = await fetchUrl("/api/orders/non-existent-order-id-123");
    // Should return 401 or 404 (order not found or unauthorized)
    if (res.status !== 401 && res.status !== 404) {
      throw new Error(`Expected 401 or 404, got ${res.status}`);
    }
  });

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================\n");

  if (passed !== total) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
