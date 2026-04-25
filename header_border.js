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
    let modified = false;

    // We want to force the leftmost padding of the header to 0 so the menu dots are glued to the edge like in the root page.
    // Usually the header starts with `<header className="\`... px-4 md:px-6 ... \${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}\`">`
    // We can replace the end of that ternary from `: ""` to `: "pl-0"`
    
    // Pattern 1:
    content = content.replace(/\$\{isMenuOpen \? "([^"]+)" : ""\}/g, '${isMenuOpen ? "$1" : "pl-0"}');

    // Also look for `px-4 md:px-6` on the header and change to `pr-4 md:pr-6 pl-0` on exactly that header just to be safe it's always flush left on mobile too.
    const headerOuterRegex = /<header className={`([^`]*)px-(\d+) md:px-(\d+)([^`]*)`}/g;
    content = content.replace(headerOuterRegex, (m, before, pX1, pX2, after) => {
        return `<header className={\`${before}pr-${pX1} md:pr-${pX2} pl-0${after}\`}`;
    });

    const headerOuterRegex2 = /<header className={`([^`]*)px-(\d+)([^`]*)`}/g;
    content = content.replace(headerOuterRegex2, (m, before, pX1, after) => {
        return `<header className={\`${before}pr-${pX1} pl-0${after}\`}`;
    });

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed header left margin in:', filePath);
    }
  }
});
