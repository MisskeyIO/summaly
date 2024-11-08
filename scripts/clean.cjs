const fs = require('node:fs');

(async () => {
  fs.rmSync(`${__dirname}/../dist`, { recursive: true, force: true });
})();
