import fs from 'fs';
import path from 'path';
const FILE_NAME = 'README',
    FILE_TYPE = 'md';
const WHITE_DIR_LIST = ['.vscode', 'node_modules', '.git', 'assets'];
function generateReadme() {
    try {
        const root = process.cwd();
        const stream = fs.createWriteStream(path.join(root,`./${FILE_NAME}.${FILE_TYPE}`),{
            flags: 'w'
        });
        stream.write('## 小笔记  \n');
        stream.write(fs
            .readdirSync(root)
            .filter(
                (dir) =>
                    !WHITE_DIR_LIST.includes(dir) &&
                    fs.statSync(dir).isDirectory(),
            ).map(dir => {
                const index = dir.indexOf('-');
                if(index > 0){
                    const name = dir.slice(0,index);
                    return `[${name}](https://hy-lxh.github.io/note/${dir}/index.html)`;
                }
                return '';
            }).join('  \n'));
        stream.on('end',() => {
            stream.close();
        });
    } catch (e: any) {}
}

generateReadme();
