# mmo-langs
Carga archivos tipo JSON con mensajes componiendo un único objeto diccionaro `<clave-mensaje>:<texto>`. <br>
La forma de cargar los archivos es la siguiente:
* Se recorren todos los árboles de directorios deseados cargando los archivos con el nombre '*default-lang.json*' o el indicado mediante `lang.setDefaultFileName` y, si se ha indicado así, los que tengan el sufijo de idioma correspondiente.
* Se fusionán todos los '*default-lang.json*' en un único objeto informando, si se desea, de las claves que han sido sobreescritas.
* Se sobreescriben las propiedades cargadas con las correspondientes al idioma deseado(si se indico uno).

## instalación
```ts
npm install terkojones/mmo-langs
```
## uso
```ts
import langs from 'mmo-langs'
```

# Función-objeto `langs`
Carga todos los archivos de mensajes por defecto('default-lang.json' si no si indica otra cosa mediante `lang.setMainFile`) de el árbol/árboles de directorios indicados y, si se indica, les agrega los del idioma de código indicado.
```ts
langs(options: ILangOptions): void;
langs(directory: string | string[], options: ILangOptions): void;
langs(directory: string | string[], langCode: string, options: ILangOptions): void;
```
 * `directories`: directorio o directorios a explorar.
 * `langCode`: código del lenguage buscado.
 * `options`: opciones de carga.

Los códigos de mensaje tienen la forma xx_XX y un fichero será seleccionado cuando su nombre coincida con el patrón `<nombre>-xx_XX.json` o simplemente `xx_XX.json`(p.e. '*mensajes-es_ES.json*' o '*es_ES.json*').
Las opciones pasadas como argumento tienen preferencia sobre las pasadas en `options`.
## Miembros de función-objeto `langs`
### Propiedad `langs.defaultFile`
Establece/Devuelve el nombre del archivo de mensajes por dejecto. Si no se asigna éste será `default-lang.js`. 
```ts
langs.defaultFile: string // p.o. default-lang.json
```
* `filename` Nuevo nombre para archivo de mensajes por defecto.
### Propiedad `langs.logger`
Establece/devuelve la función de logüeo a utilizar cuando se invoca `langs.info`.
```ts
langs.logger: typeof console.log // p.o. console.log 
```
### Método miembro `langs.info`
Proporciona información detallada sobre la configuración de los mensajes a partir de los ficheros seleccionados através de `lang.logger`.
```ts
langs.info(); 
```


## Ejemplos
Con la estructura de directorios: 
```
langs
    errors
        default-lang.json
        errors-es_ES.json
    messages
        default-lang.json
        es_ES.json
```
... y los archivos ... <br>
archivo *errors/default-lang.json*
```json
{
    "ERR_TYPE": "Type mismatch",
    "ERR_RANGE": "Index out of range"
}

```
archivo *erros/errors-es_ES.json*
```json
{
    "ERR_TYPE": "Error de tipo",
    "ERR_RANGE": "Índice fuera de rango"
}
```
archivo *messages/default-lang.json*
```json
{
    "READY": "Are you ready?",
    "PUSH_KEY": "Push any key to continue.",
    "ERR_TYPE": "Type failded",
    "STILL_HERE": "Still here"
}
```
archivo *messages/es_ES.json*
```json
{
    "READY": "¿Estás listo?",
    "PUSH_KEY": "Pulsa una tecla para continuar",
    "ALSO_HERE": "También aquí"
}
```
El código  ...
```ts
import langs from '../index';

const msgs = langs(['langs/errors_messages', 'langs/messages'],  'es_ES');

// const msgs = langs('langs',  'es_ES');
// conduce al mismo resultado ya que la busqueda es recursiva en todas las subcarpetas.

```

Cargaría en `msgs` el siguiente contenido: 
```js
{
  ERR_TYPE: 'Error de tipo',
  ERR_RANGE: 'Índice fuera de rango',
  READY: '¿Estás listo?',
  PUSH_KEY: 'Pulsa una tecla para continuar',
  STILL_HERE: 'Still here',
  ALSO_HERE_TOO: 'También aquí'
}
```

Notar que tanto STILL_HERE, que tan sólo está en *messages/default-lang.json*, como ALSO_HERE, que sólo está en *messages/es_ES.json* también se recogen en la salida.

Si se invocará el métod `langs.info` con los mismos argumentos:
```ts
langs.info('langs',  'es_ES');
```
Daría una salida en logger del tipo
```
From ...\langs\errors_messages\default-lang.json:
	 ERR_TYPE
	 ERR_RANGE

From ...\langs\messages\default-lang.json:
	 READY
	 PUSH_KEY
	 ERR_TYPE
	 STILL_HERE
Sobrescrito ERR_TYPE('Type mismatch') con 'Type failded'.
1 mensaje[s] sobreescritos.

From ...\langs\errors_messages\mensajes-es_ES.json;
	 ERR_TYPE
	 ERR_RANGE

From ...\langs\messages\es_ES.json;
	 READY
	 PUSH_KEY
	 ALSO_HERE_TOO

Claves sin traducción:
	STILL_HERE: 'Still here'

Claves sin contrapartida:
	ALSO_HERE_TOO: 'También aquí'

Diccionario resultante:
	ERR_TYPE.............. ERR_TYPE: 'Error de tipo'
	ERR_RANGE............. ERR_RANGE: 'Índice fuera de rango'
	READY................. READY: '¿Estás listo?'
	PUSH_KEY.............. PUSH_KEY: 'Pulsa una tecla para continuar'
	STILL_HERE............ STILL_HERE: 'Still here'
	ALSO_HERE_TOO......... ALSO_HERE_TOO: 'También aquí'
```