import * as path from 'path';
import * as fs from 'fs';


type TMessageDictionaty = {
    [key: string]: string;
}
type TMessages = {
    readonly [key: string]: string;
}

/**
 * Función que comprueba la valides de determinada ruta de archivo.
 * @param {path.ParsedPath}     parsedPath ruta tal y como la devuelve la función 'path.parse';
 */
type TFilePredicate = (parsedPath: path.ParsedPath) => boolean;



/**
 * Opciones de carga
 * @property {boolean}      [safe]      Determina si se informa o no de la sobre escritura de mensajes.  
 * @property {string}       [langCode]  Código del lenguage a cargar. Los códigos de lenguage tienen la forma xx_XX.
 */
interface ILangOptions {
    directories?: string | string[],
    langCode?: string,
    defaultFile?: string
}

/**
 * Extrae el sufijo con lenguage y extension de los nombres archivos de messages. Estos archivos han de terminar con:
 * -xx_XX.json o -xx_XX.js
 * En el caso de ser .js han de exportar únicamente un objeto  Dictionario.
 */
const REX_LANG_CODE = /^([a-z]{2}_[A-Z]{2})$/g

let _defaultFileName = 'default-lang.json';
let _log = console.log;

/**
 * Agrega las claves de fuente en el objetivo convirtiéndolas a mayúsculas e informando via log de las propiedad sobreescritas. 
 * @param {TMessageDictionaty} target  Objetivo
 * @param {TMessageDictionaty} source  Fuente
 */
function safe_assign(target: TMessageDictionaty, source: TMessageDictionaty) {
    let key: string;
    let ac = 0;
    for (let k in source) {
        key = k.toLocaleUpperCase();
        if (target.hasOwnProperty(key)) {
            _log("Sobrescrito %s('%s') con '%s'.", key, target[key], source[k]);
            ac++;
        }
        target[key] = source[k];
    }
    if (ac) _log("%d mensaje[s] sobreescritos.", ac)
}

/**
 * Agrega las claves de fuente en el objetivo convirtiéndolas a mayúsculas sin comprobaciones. 
 * @param {TMessageDictionaty} target  Objetivo
 * @param {TMessageDictionaty} source  Fuente
 */
function unsafe_assign(target: TMessageDictionaty, source: TMessageDictionaty) {
    for (let k in source) target[k.toLocaleUpperCase()] = source[k];
}


/**
 * Devuelve un TFilePredicate que validará los ficheros a procesar en función de si se pasa o no un código de lenguage.
 * Los códigos de lenguage tienen la forma xx_XX, y un fichero de mensajes será validado cuando tenga la terminación
 * <nombre>-<código>.json o simplemente <código>.json(ej. 'mensajes-es_ES.json' o 'es_ES').
 * @param {string}      langCode código del lenguage  
 * @returns {TFilePredicate}
 */
function lang_predicate(langCode: string): TFilePredicate {
    if (langCode) {
        const rex = new RegExp('-' + langCode + '\\.json$');
        return (parsedPath: path.ParsedPath): boolean => {
            return parsedPath.base === _defaultFileName || rex.exec(parsedPath.base) !== null || parsedPath.base === langCode + '.json';
        }
    } else {
        return (parsedPath: path.ParsedPath): boolean => {
            return parsedPath.base === _defaultFileName;
        }
    }
}

/**
 * Recorre el directorio pasado y todos sus descendientes en busca de los archivos que cumplan con el predicado.
 * @param {string}          root        directorio raiz para la busqueda. 
 * @param {TFilePredicate}  predicate   función que determina los ficheros a devolver.
 * @yield {path.ParsedPath}             fichero validado.
 */
function* file_gen(root: string, predicate: TFilePredicate) {
    root = path.resolve(root);
    if (!fs.existsSync(root)) throw new Error("No existe el directorio de mensajes '" + root + "'.") //:(>

    yield* (function* local(dir: string) {
        const dirs = fs.readdirSync(dir, {
            encoding: 'utf8',
            withFileTypes: true
        });
        for (let i = 0; i < dirs.length; i++) {
            let entry = dirs[i];
            if (entry.isDirectory()) {
                yield* local(path.join(dir, entry.name))
            } else {
                let fileEntry: path.ParsedPath = path.parse(path.join(dir, entry.name));
                if (predicate(fileEntry)) yield fileEntry;
            }
        }
    }(root))
}

function langs(directory: string | string[], langCode?: string): TMessages;
function langs(directory: string | string[], options?: ILangOptions): TMessages;
function langs(directory: string | string[], langCode?: string, options?: ILangOptions): TMessages;
/**
 * Carga todos los archivos de mensajes por defecto('default-lang.json' si no si indica otra cosa) de el 
 * árbol/árboles de directorios indicados y, si se indica, les agrega los del idioma de código indicado.
 * @param {string|string[]}     directories directorio o directorios a explorar.
 * @param {string}              [langCode]  Código del lenguage buscado.
 * @param {ILangOptions}        [options]   Opciones de carga.
 */
function langs(directories: string | string[], langCode?: string | ILangOptions, options?: ILangOptions): TMessages {

    options = check_options(directories, langCode, options);
    const msgs: TMessageDictionaty = {};
    const langs: path.ParsedPath[] = [];
    if (!Array.isArray(directories)) directories = [directories];

    for (let dir of options.directories) {
        for (let it of file_gen(dir, lang_predicate(options.langCode))) {
            if (it.base !== _defaultFileName) {
                langs.push(it);
            } else {
                unsafe_assign(msgs, JSON.parse(fs.readFileSync(path.format(it), 'utf8')));
            }
        }
    }
    for (let i = 0; i < langs.length; i++) {
        unsafe_assign(msgs, JSON.parse(fs.readFileSync(path.format(langs[i]), 'utf8')));
    }
    return <TMessages>msgs;
}

function check_options(directories: string | string[] | ILangOptions, langCode?: string | ILangOptions, options?: ILangOptions): ILangOptions {
    const rexLang = /^([a-z]{2}_[A-Z]{2})$/g
    let opt: ILangOptions = {};
    if (typeof directories === 'string' || Array.isArray(directories)) {
        opt.directories = directories;
        if (!Array.isArray(opt.directories)) opt.directories = [opt.directories];
        if (typeof langCode === 'string') {
            opt.langCode = langCode;
        } else if (langCode) {
            opt = Object.assign({}, <ILangOptions>langCode, opt);
        } else {
            opt.langCode = '';
        }
        if (options) opt = Object.assign({}, options, opt);
    } else {
        opt = <ILangOptions>directories;
    }
    if (!opt.directories) throw new Error("No se han indicado directorios de busqueda.")
    if (opt.langCode && !rexLang.exec(opt.langCode)) throw new Error(`"${langCode}" no es un formato de idioma válido(xx_XX).`)
    if (opt.defaultFile) {
        let ext = path.parse(opt.defaultFile).ext;
        if (!ext) {
            opt.defaultFile += '.json';
        } else if (ext !== '.json') {
            throw Error(`Se esperaba .json para ${opt.defaultFile}`)
        }
    }
    return opt;
}

function show_info(directories: string | string[] | ILangOptions, langCode?: string | ILangOptions, options?: ILangOptions) {
    options = check_options(directories, langCode, options);
    const langs: path.ParsedPath[] = [];
    const dfts: TMessageDictionaty = {};
    const trans: TMessageDictionaty = {};
    let content: TMessageDictionaty;
    let filepath: string;

    for (let dir of options.directories) {
        for (let it of file_gen(dir, lang_predicate(options.langCode))) {
            if (it.base !== _defaultFileName) {
                langs.push(it);
            } else {
                filepath = path.format(it);
                content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                _log('\nFrom %s:', filepath);
                Object.keys(content).forEach(k => _log('\t %s', k));
                safe_assign(dfts, content);
            }
        }
    }

    let keys = Object.keys(dfts);
    let noTranslate = Array.from(keys);
    for (let i = 0; i < langs.length; i++) {
        filepath = path.format(langs[i]);
        content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        _log('\nFrom %s;', filepath)
        Object.keys(content).forEach(k => {
            _log('\t %s', k)
            let ix = noTranslate.indexOf(k.toUpperCase());
            if (ix > -1) noTranslate[ix] = '';
        });
        safe_assign(trans, JSON.parse(fs.readFileSync(filepath, 'utf8')));
    }

    if (langs.length) {
        noTranslate = noTranslate.filter(k => k !== '');
        if (noTranslate.length) {
            _log('Claves sin traducción:');
            noTranslate.forEach(k => _log("\t%s: '%s'", k, dfts[k]));
        }
        let noSource = Object.keys(trans).filter(k => !keys.includes(k));
        if (noSource.length) {
            _log("Claves sin contrapartida:");
            noSource.forEach(k => _log("\t%s: '%s'", k, trans[k]))
        }
    }
    const msgs: TMessageDictionaty = Object.assign(dfts, trans);
    _log("Diccionario resultante:")
    Object.keys(msgs).forEach(k => {
        _log("\t" + k.padEnd(20, '.') + ".. %s: '%s'", k, msgs[k]);
    });
}

namespace langs {
    /**
     * Establece la función de logüeo a utilizar cuando se usa el modo segúro.
     * @param {console.log} log función al estilo console.log; 
     */
    export function setLogger(log: typeof console.log) {
        _log = log;
    }

    /**
     * Establece el nombre del archivo de mensajes por dejecto. Si no se undica éste será `default-lang.js`. 
     * @param {string}  filename    Nuevo nombre para archivo de mensajes por defecto.  
     */
    export function setDefaultFileName(filename: string) {
        _defaultFileName = filename;
    }
    export const info = show_info;
}
export default langs;