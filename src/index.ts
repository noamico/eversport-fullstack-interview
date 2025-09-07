import { config } from 'dotenv';
import { main } from './main';

config({ path: '.env.test' });
config({ path: '.env.local' });
config({ path: '.env' });

(async () => {
  await main();
})();
