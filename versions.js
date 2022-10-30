import * as fs from 'fs/promises';
import { argv } from 'process';
import * as path from 'path';
import { fileURLToPath } from 'url';
const shouldUpdateZ = argv[2] === 'z' || '--z' ? argv[2] : '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let currentDir;
try {
    currentDir = await fs.opendir(__dirname);
}
catch (err) {
    console.error(err);
    process.exit();
}
for await (const dirent of currentDir) {
    if (dirent.isFile()) {
        if (dirent.name.startsWith('.env')) {
            const filePath = path.resolve(__dirname, dirent.name);
            const fileContents = await fs.readFile(filePath, 'utf-8');
            const fileProperties = fileContents.split(/\r?\n/);
            const appVersion = fileProperties.find(prop => prop.startsWith('VITE_APP_VERSION'));
            if (!appVersion) {
                console.log('VITE_APP_VERSION key not found');
                continue;
            }
            const versionNumMatch = appVersion.match(/"([^"]*)"/);
            let versionNum;
            if (versionNumMatch) {
                versionNum = versionNumMatch[1];
            }
            if (!versionNum)
                continue;
            const xyz = versionNum.split('.');
            const z = xyz.length === 3 ? xyz[2] : null;
            if (!z)
                continue;
            const dateStrMatch = z.match(/\((.*)\)/);
            let dateStr;
            if (dateStrMatch)
                dateStr = dateStrMatch[1];
            let newDateStr;
            if (dateStr) {
                let now = roundMinutes(new Date(Date.now()));
                let hour = now.getHours();
                let hourStr;
                if (hour < 10) {
                    hourStr = `0${hour}`;
                }
                else {
                    hourStr = hour.toString();
                }
                let nowStr = now
                    .toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
                    .substring(2, 10)
                    .replaceAll('/', '');
                if (hourStr === dateStr.substring(6, 8)) {
                    now = addHour(now);
                    hour = now.getHours();
                }
                if (hour < 10) {
                    hourStr = `0${hour}`;
                }
                else {
                    hourStr = hour.toString();
                }
                nowStr = now
                    .toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
                    .substring(2, 10)
                    .replaceAll('/', '');
                newDateStr = nowStr + hourStr;
                let newVersionNum;
                if (newDateStr > dateStr) {
                    newVersionNum = replaceContent(versionNum, dateStr, newDateStr);
                }
                else {
                    newVersionNum = versionNum;
                }
                if (shouldUpdateZ) {
                    const miniVersionNumberMatch = z.match(/(^[0-9]+?)\(/);
                    let newMiniVersion;
                    if (miniVersionNumberMatch) {
                        const oldMiniVersion = miniVersionNumberMatch[1];
                        newMiniVersion = (Number(oldMiniVersion) + 1).toString();
                        const newXYZ = newVersionNum.split('.');
                        const newZ = newXYZ.length === 3 ? newXYZ[2] : null;
                        if (newZ) {
                            const updatedNewZ = newZ.replace(oldMiniVersion, newMiniVersion);
                            newVersionNum = replaceContent(newVersionNum, newZ, updatedNewZ);
                        }
                    }
                }
                const newContent = replaceContent(fileContents, versionNum, newVersionNum);
                try {
                    await fs.writeFile(filePath, newContent);
                }
                catch (err) {
                    console.log(err);
                }
            }
        }
    }
}
function roundMinutes(date) {
    date.setHours(date.getHours() + Math.round(date.getMinutes() / 60));
    return date;
}
function addHour(date) {
    date.setHours(date.getHours() + 1);
    return date;
}
function replaceContent(oldContent, oldVersion, newVersion) {
    return oldContent.replace(oldVersion, newVersion);
}
//# sourceMappingURL=versions.js.map