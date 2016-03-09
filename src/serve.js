import _Https from 'https';
import _Fs from 'fs';
import _Auth from 'http-auth';
import _Cors from 'cors';
import _Express from 'express';


const tls_path      = _Fs.realpathSync(__dirname + "/../tls");
const bundle_buffer = _Fs.readFileSync(tls_path + '/letsencrypt_chain.crt');

const https_options = {
    ca:   bundle_buffer,
    key:  _Fs.readFileSync(tls_path + '/ucaffectstudy.xyz.key'),
    cert: _Fs.readFileSync(tls_path + '/ucaffectstudy.xyz.crt')
};

let basic = _Auth.basic({

    file: __dirname + "/../auth.basic"
});


export function setupExpressApp_M({app}) {

    app.use(_Cors());
    app.set('x-powered-by', false);
    app.use(_Auth.connect(basic));
}


export function getApp() {

    let app = _Express();
    setupExpressApp_M({app});
    return app;
}

export function tlsWrapper(app) {

    let server = _Https.createServer(https_options, app);
    return server;
}
