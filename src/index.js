import _Promise from 'bluebird';
import _Ram from 'ramda';
import _Csvcb from 'csv-stringify';

import * as _FB from './firebase';
import * as _Serve from './serve';

// workaround for hidden promise rejections, see: <https://github.com/nodejs/node/issues/830>
process.on('unhandledRejection', err => { throw err; });

const _Csv           = _Promise.promisify(_Csvcb);
const top_level      = 'affectstudy';
const firebase_host  = process.env.FIREBASE_HOST;
const firebase_token = process.env.FIREBASE_TOKEN;
let env              = '';
let output_type      = 'csv';


async function getFirebaseData(host, token, top_level, env) {
    let root_ref = _FB.makeRootRef(host);
    let ref      = _FB.buildEnvRef(root_ref, top_level, env);

    await ref.authWithCustomToken(token);

    return ref.orderByChild('start_ms').once('value');

}

async function handleRequest(req, res) {
    const requested_url = req.url;
    const env           = req.params[0].split('/')[0];
    output_type         = req.query.type;

    if (!env || env === 'favicon.ico') {
        return res.status(400).end();
    }

    if (['json', 'csv'].indexOf(output_type) < 0) {
        return res.status(400).end();
    }

    let snapshot = await getFirebaseData(firebase_host, firebase_token, top_level, env);

    const fb_data = snapshot.val();

    res.attachment();

    if (output_type === 'json') {

        res.type('json');
        return res.json(fb_data).end();
    }

    const csv_data = await firebaseDataToCsv(fb_data);

    res.type('csv');
    res.send(csv_data);
}

async function firebaseDataToCsv(fb_data) {

    const users_object = _Ram.mapObjIndexed(userObjToArray, fb_data);
    let users_array    = _Ram.values(users_object);
    const header_row   = createHeaderRow();

    users_array.unshift(header_row);

    const csv = await _Csv(users_array);
    return csv;
}

const genderMap = {
    male : 0,
    female: 1,
    other: 2
};

const sexOriMap = {
    heterosexual: 0,
    other: 1
};

const raceMap = {
    white: 0,
    other: 1
};

const emotionMap = {
    disgust: 1,
    fear: 2,
    anger: 3,
    anxiety: 4,
    sadness: 5
};

const correctMap = {
    false: 0,
    true: 1
};

function userObjToArray(uo, user_id) {

    let user_data = [ user_id,
        uo.age,
        genderMap[uo.gender],
        sexOriMap[uo.sexual_orientation],
        raceMap[uo.race]
    ];
    let qual_data = [uo.qual1, uo.qual2, emotionMap[uo.emotion]];

    let image_objects = _Ram.mapObjIndexed(buildImageArray, uo.images);
    let all_images    = fillMissingImages_M(image_objects);
    const image_data = _Ram.values(all_images);

    const combined = user_data.concat(image_data, qual_data);
    const flat = _Ram.flatten(combined);
    return flat;
}

function fillMissingImages_M(image_objects) {

    _Ram.range(1, 61).map(idx => {
        if (!image_objects[idx]) {
            image_objects[idx] = [null,null,null,null];
        }
    });

    return image_objects;
}

function buildImageArray(imageObj) {

    const {correct, start_ms, end_ms, image_number, sequence_number} = imageObj;

    const interval_ms = end_ms - start_ms;
    const interval_s  = msToS(interval_ms);
    const cat_num     = getCategoryNumber(image_number);

    return [interval_s, sequence_number, correctMap[correct], cat_num];
}

function msToS(ms, precision = 3) {
    return (ms / 1000).toFixed(precision);
}

function getCategoryNumber(image_number) {
    return Math.ceil(image_number / 5);
}

function createHeaderRow() {
    let headers = ["ID", "Age", "Gender", "Sexual Orientation", "Race"];
    _Ram.range(1, 61).map(idx => {
        headers.push(`Image ${idx} Time`);
        headers.push(`Sequence Number`);
        headers.push(`Correct`);
        headers.push(`Category`);
    });
    headers.push("Qualitative Response 1");
    headers.push("Qualitative Response 2");
    headers.push("Emotion");
    return headers;
}

function main() {
    let app = _Serve.getApp();
    app.get('/*', handleRequest);
    let server = _Serve.tlsWrapper(app);
    server.listen(process.env.PORT || 3249);
}

main();
