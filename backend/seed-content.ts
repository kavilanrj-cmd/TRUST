import "dotenv/config";
import { seedSiteContentIfNeeded } from "./src/admin/website";
import { getPublishedContentMap } from "./src/admin/website";

async function main() {
  await seedSiteContentIfNeeded();
  const map = await getPublishedContentMap();
  console.log("Seeded content keys:", Object.keys(map).length);
}

main()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
