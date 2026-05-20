const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

let result = "";
let lastIndex = 0;

for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
        let prevClose = css.lastIndexOf('}', i);
        let prevOpen = css.lastIndexOf('{', i - 1);
        
        let startOfSelector = 0;
        if (prevClose > prevOpen) {
            startOfSelector = prevClose + 1;
        } else if (prevOpen > prevClose) {
            startOfSelector = prevOpen + 1;
        }
        
        let selector = css.substring(startOfSelector, i);
        
        if (selector.includes(':hover')) {
            let closeBrace = css.indexOf('}', i);
            
            result += css.substring(lastIndex, startOfSelector);
            
            lastIndex = closeBrace + 1;
            i = closeBrace;
        }
    }
}
result += css.substring(lastIndex);

fs.writeFileSync('style.css', result);
console.log('Hover effects removed successfully.');
