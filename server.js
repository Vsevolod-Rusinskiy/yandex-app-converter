const express = require('express');
const fs = require('fs');
const fsPromise = require('fs/promises');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config()

const errorMessage = chalk.red
const successMessage = chalk.blue

const {
    v4: uuidv4
} = require('uuid');
const uniqueFileName = uuidv4();

const PORT = process.env.PORT || 3000;
const app = express();


app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({
    extended: false,
    limit: '50mb'
}));

app.use(express.static(__dirname + '/public'));


app.listen(PORT, (req, res) => {
    console.log(`Server is running on port ${PORT}`);
})

app.get('/', function (req, res) {
    res.render('index.html')
});

app.post('/query', function (req, res) {

    const folderId = process.env.FOLDER_ID;
    const iamToken = process.env.IAM_TOKEN;
    const encoded = req.body.data;
    const body = `
    {
        "folderId": "${folderId}",
        "analyze_specs": [{
            "content": "${encoded}",
            "features": [{
                "type": "TEXT_DETECTION",
                "text_detection_config": {
                    "language_codes": ["*"]
                }
            }]
        }]
    }`
    // console.log(encoded);
    const image = Buffer.from(encoded, 'base64');

    fs.writeFile(path.resolve(__dirname, 'image.png'), image, (err) => {
        if (err) {
            console.log(errorMessage(err.message));
        } else {
            console.log(successMessage('Картинка сохранена'));
        }
    });

    async function yandexCloudQuery() {
            answer = await axios({
                method: 'post',
                url: 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze',
                headers: {
                    'Authorization': `Bearer ${iamToken}`,
                    'Content-Type': "application/json"
                },
                data: body
            })
      
        const responseBody = answer.data;
        let textLine = '';
        try {
            for (const elem of responseBody.results[0].results[0].textDetection.pages[0].blocks) {
                for (const elemArray of elem.lines) {
                    for (const elemLineArray of elemArray.words) {
                        textLine = textLine + elemLineArray.text + ' ';
                    }
                }
            }
        } catch (err) {
            console.log(errorMessage(err.message), 'Что-то не так c массивом');
        }

        try {
            await fsPromise.writeFile(path.resolve(__dirname, `${uniqueFileName}.txt`), textLine)
            console.log(successMessage('Файл сохранен'));

        } catch (err) {
            console.log(errorMessage(err.message));
        }

        const stream = fs.createReadStream(`${uniqueFileName}.txt`);
        stream.pipe(res.status(200));

        stream.on('error', (err) => {
            if (err) {
                console.log('Файлы не отправились на клиент!', errorMessage(err.message));
            }
        });
    }
    yandexCloudQuery().catch(err => {
        console.log(errorMessage(err.message), 'Что-то не так c ответом от Yandex !');
    });
});

