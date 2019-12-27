import langs from '../index';

langs.setLogger(console.warn);


const msgs = langs(['src/errors_messages', 'src/messages'], {
    safe: true,
    langCode: 'es_ES'
});
console.log(msgs);
