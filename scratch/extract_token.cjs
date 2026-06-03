const fs = require('fs');
const path = require('path');

const dir = '/Users/denielson/Library/Application Support/Google/Chrome/Default/Session Storage';

function main() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath);
      
      // Let's find all occurrences of "eyJ" in the buffer
      let pos = 0;
      while (true) {
        pos = content.indexOf('eyJ', pos);
        if (pos === -1) break;
        
        // Extract up to 1000 characters (or until non-base64 characters like ", \0, etc)
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
          // Verify if it looks like a JWT (header.payload.signature)
          const parts = token.split('.');
          if (parts.length === 3) {
            try {
              const payload = Buffer.from(parts[1], 'base64').toString('utf8');
              const data = JSON.parse(payload);
              if (data.email) {
                console.log(`Found JWT in ${file} at pos ${pos} for email: ${data.email}`);
                console.log(token);
                return;
              }
            } catch (e) {
              // Not a valid JWT JSON
            }
          }
        }
        pos += 3;
      }
    }
  }
  console.log("No valid JWT token found in session storage.");
}

main();
