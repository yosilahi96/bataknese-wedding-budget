const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error("Usage: node scripts/api-smoke-test.js <api-base-url>");
  process.exit(2);
}

const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
const healthUrl = `${normalizedBaseUrl}/api/health`;

async function main() {
  const response = await fetch(healthUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Expected 2xx from ${healthUrl}, got ${response.status}`);
  }

  const body = await response.json();

  if (body.status !== "ok") {
    throw new Error(`Expected health status "ok", got ${JSON.stringify(body)}`);
  }

  console.log(`API smoke test passed: ${healthUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
