const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('<button') && !line.includes('onClick') && !line.includes('type="submit"') && !line.includes('disabled')) {
           // check if onClick is on the next few lines
           let hasOnClick = false;
           let tagClosed = false;
           for(let j=0; j<5 && i+j < lines.length; j++){
               if(lines[i+j].includes('onClick') || lines[i+j].includes('type="submit"')) { hasOnClick = true; break; }
               if(j > 0 && lines[i+j].includes('<button')) break;
               if(lines[i+j].includes('>')) tagClosed = true;
               if(tagClosed) break;
           }
           if (!hasOnClick) console.log(file + ':' + (i+1) + ' - ' + line.trim());
        }
      });
    }
  });
  return results;
}

walk('src');
