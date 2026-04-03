const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'admin-panel', 'src');

function walkDir(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach((name) => {
        const filePath = path.join(currentDirPath, name);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkDir(filePath, callback);
        }
    });
}

walkDir(dir, function(filePath) {
    if (filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        newContent = newContent.replace(/fetch\(`\/api\//g, "fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.gameonesport.xyz/api'}/");
        newContent = newContent.replace(/fetch\('\/api\//g, "fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.gameonesport.xyz/api'}/");
        newContent = newContent.replace(/fetch\("\/api\//g, "fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.gameonesport.xyz/api'}/");
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent);
            console.log('Fixed', filePath);
        }
    }
});
