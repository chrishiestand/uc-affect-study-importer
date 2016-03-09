import _Firebase from 'firebase';

export function makeRootRef(hostname) {
    return new _Firebase(`https://${hostname}`);
}

export function buildPath(ref, pathParts){

    if (pathParts.indexOf(null) > -1 || pathParts.indexOf(undefined) > -1 || pathParts.indexOf('') > -1) {
        throw new Error(`firebase path should never contain null, undefined or empty strings: ${pathParts.join('/')}`);
    }

    return ref.child(pathParts.join('/'));
}

export function buildEnvRef(ref, top_level, env) {
    return buildPath(ref, [top_level, env]);
}
