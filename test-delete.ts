import { WBSService } from './services/wbs.service.js';

async function main() {
  try {
    const result = await WBSService.delete('b2de9e3e-e459-4011-b3bb-1f0ccabe21df');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

main();
