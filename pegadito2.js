const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dirPath));
  });
}

walkDir('./src/app', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('className="-ml-2 sm:-ml-1 h-10 w-auto relative cursor-pointer')) {
      content = content.replace(/className="-ml-2 sm:-ml-1 h-10 w-auto relative cursor-pointer/g, 'className="-ml-4 h-10 w-auto relative cursor-pointer');
      fs.writeFileSync(filePath, content);
      console.log('Made logo super pegadito (-ml-4) in:', filePath);
    }
  }
});
