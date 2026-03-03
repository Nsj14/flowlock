const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function download(file) {
    return new Promise((resolve, reject) => {
        const url = baseUrl + file;
        const dest = path.join(modelsDir, file);
        if (fs.existsSync(dest)) {
            console.log(`Skipping ${file}, already exists`);
            return resolve();
        }
        console.log(`Downloading ${file}...`);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(dest);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    try {
        for (const file of files) {
            await download(file);
        }
        console.log('Done downloading models!');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
