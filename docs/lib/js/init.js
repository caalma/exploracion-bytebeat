import ByteBeatNode from './ByteBeat.module.js';
import { convertBytesToHex, convertHexToBytes } from './utils.js';

let doNotSetURL = false;
let g_ignoreHashChange;
let g_context;
let g_byteBeatNode;
let g_playing = false;
let g_bb_rate = 8000;
let g_bb_code_l = '';
let g_bb_code_r = '';
let g_actual_code = '';

function getQueryGreggmanStyle(fn=()=>{}) {
    compressor.compress(
        g_actual_code.trim(), 1,
        function(bytes) {
            const hex = convertBytesToHex(bytes);
            g_ignoreHashChange = true;
            const params = new URLSearchParams({
                t: g_byteBeatNode.getType(),
                e: g_byteBeatNode.getExpressionType(),
                s: g_byteBeatNode.getDesiredSampleRate(),
                bb: hex,
            });
            fn(`#${params.toString()}`);
        },
        ()=>{}
    );
}

async function init() {
    g_context = new AudioContext();
    ByteBeatNode.setup(g_context).then(e => {
        g_byteBeatNode = new ByteBeatNode(g_context);
        g_byteBeatNode.setType(ByteBeatNode.Type.byteBeat);
        g_byteBeatNode.setExpressionType(ByteBeatNode.ExpressionType.postfix);
        g_byteBeatNode.setDesiredSampleRate(parseInt(g_bb_rate));
        updateCode().then(e => {
            console.log('updateCode en init', e);
        });
    });
}

async function reinit() {
    if (g_playing) {
        g_playing = false;
        g_byteBeatNode.disconnect();
        init().then( e => {
            console.log('init TRUE', e)
            g_playing = true;
            //g_byteBeatNode.connect(g_context.destination);
        });
    }else{
        init().then(e => {
            console.log('init FALSE', e)
        });
    }
}

async function info() {
    console.log({
        'gbb': g_byteBeatNode,
        'rate': g_byteBeatNode.getDesiredSampleRate(),
        'time': g_byteBeatNode.getTime(),
        'type': g_byteBeatNode.getType(),
        'n channles': g_byteBeatNode.getNumChannels(),
        'expresion type': g_byteBeatNode.getExpressionType(),
    });
}

async function updateCode() {
    if (g_context) {
        let codes = g_bb_code_r === undefined ? [g_bb_code_l] : [g_bb_code_l, g_bb_code_r];
        if(g_byteBeatNode){
            g_byteBeatNode.setExpressions(codes)
                .then(e => {
                    console.log('updateCode interno', e);
                })
                .catch(e => {
                    console.log('updateCode interno error', e);
                });
        }
    }
}

async function asyncSetCode(cl, cr) {
    g_bb_code_l = cl;
    g_bb_code_r = cr;
    await updateCode();
}

async function asyncSetRate(rt) {
    g_bb_rate = rt;
    await reinit();
}

function playPause() {
    const aplicar = () => {
        if(g_byteBeatNode){
            if (!g_playing) {
                g_byteBeatNode.connect(g_context.destination);
            } else {
                g_byteBeatNode.disconnect();
            }
            g_playing = !g_playing;
        }
    }
    if (!g_context) {
        init().then(aplicar);
    }else{
        aplicar();
    }
}

function copiarAlPortapapeles(texto) {
     if (navigator.clipboard && window.isSecureContext) {
         return navigator.clipboard.writeText(texto).then(() => {
             console.info('Copiado al portapapeles');
         }).catch(err => {
             console.error('Error al copiar al portapapeles: ', err);
         });
     } else {
         let textArea = document.createElement("textarea");
         textArea.value = texto;
         textArea.style.position = "fixed";
         textArea.style.left = "-999999px";
         document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();
         return new Promise((resolve, reject) => {
             document.execCommand('copy') ? resolve() : reject();
             document.body.removeChild(textArea);
         }).then(() => {
             console.info('Copiado al portapapeles');
         }).catch(err => {
             console.error('Error al copiar al portapapeles: ', err);
         });
     }
}

function configureExternalsApp(){
    setTimeout(()=>{
        bb.reinit();
        getQueryGreggmanStyle(query => {
            let elems = document.querySelectorAll('.external-app');
            if(query !== 'None'){
                elems.forEach(elem => {
                    elem.setAttribute('href', elem.getAttribute('data-site') + query);
                    elem.classList.add('btn-success', 'titilar');
                    elem.classList.remove('btn-secondary');
                    setTimeout(() => {
                        elem.classList.remove('titilar');
                    }, 1000);
                });
            }else{
                elems.forEach(elem => {
                    elem.classList.add('btn-secondary');
                    elem.classList.remove('btn-success');
                });
            }
        });
    }, 200);
}

async function setCodeActual(elem){
    let cAct = 'code-actual';
    codes.forEach(e => {
        e.parentElement.classList.remove(cAct);
    });
    elem.parentElement.classList.add(cAct);
    g_bb_rate = parseInt(elem.parentElement.querySelector('[name=rate]').value);
    try {
       asyncSetRate(g_bb_rate);
    } catch (err) { }
    g_actual_code = elem.textContent;
    bb.setCode(g_actual_code);
}

function isCodeActual(elem){
    let cAct = 'code-actual';
    return elem.parentElement.classList.contains(cAct);
}

function notificar(texto){
    let cAct = 'activa';
    notificacion.innerText = texto;
    notificacion.classList.add(cAct);
    setTimeout(()=>{
        notificacion.classList.remove(cAct);
    }, 700);
}

var codes;

function on_load (ev) {
    window.bb = {
        'init': init,
        'reinit': reinit,
        'setCode': asyncSetCode,
        'setRate': asyncSetRate,
        'playPause': playPause,
        'info': info,
        'getQueryGreggmanStyle': getQueryGreggmanStyle,
        'isplay': () => g_playing,
    };

    let btnPlayPause = document.querySelector('[name=play-pause]');
    let inputRate = document.querySelectorAll('[name=rate]');
    let elemsCopiar = document.querySelectorAll('.copiar');
    let notificacion = document.querySelector('#notificacion');
    let btnPortada = document.querySelector('[name=a_portada]');
    let btnAyuda = document.querySelector('[name=a_ayuda]');
    codes = document.querySelectorAll('code');

    let setBtnPlayPause = () => {
        if(bb.isplay()){
            btnPlayPause.classList.add('btn-danger');
            btnPlayPause.classList.remove('btn-warning');
        }else{
            btnPlayPause.classList.add('btn-warning');
            btnPlayPause.classList.remove('btn-danger');
        }
    };

    let playPauseActivate = () => {
        btnPlayPause.classList.remove('btn-secondary');
        setBtnPlayPause();
    };

    if(elemsCopiar.length > 0){
        elemsCopiar.forEach(elem => {
            elem.addEventListener('click', ev => {
                copiarAlPortapapeles(elem.innerText);
                notificar('Código copiado !');
            });
        });
    }

    if(btnPlayPause){
        btnPlayPause.addEventListener('click', e => {
            let elem = btnPlayPause;
            if(elem.classList.contains('btn-secondary')){
                return;
            }
            bb.playPause();
            setBtnPlayPause();
        });
    }

    if(codes.length > 0){
        const putCode = (elem) => {
            setCodeActual(elem);
            playPauseActivate();
            setBtnPlayPause();
            configureExternalsApp();
        }
        codes.forEach(elem => {
            ['click'].forEach(evType => {
                elem.addEventListener(evType, ev => {
                    putCode(elem);
                });
            });
            elem.addEventListener('keydown', ev => {
                if(ev.key == 'Enter' && ev.altKey){
                    putCode(elem);
                }
            });
        });

        window.addEventListener('keydown', ev => {
            if(ev.altKey){
                if(ev.key == 'p'){
                    btnPlayPause.click();
                }else if(ev.key == 't'){
                    document.querySelector('[name=open-tb]').click();
                }else if(ev.key == 'h'){
                    document.querySelector('[name=open-h5bb]').click();
                }
            }
        });
    }

    if(inputRate.length > 0){
        inputRate.forEach(elem => {
            elem.addEventListener('input', ev => {
                if(g_context){
                    if(isCodeActual(elem)){
                        bb.setRate(parseInt(elem.value));
                        configureExternalsApp();
                    }
                }
            });
        });
    }

    window.addEventListener('keydown', ev => {
        if(ev.altKey){
            if(ev.key == '1' || ev.key == 'i'){
                btnPortada.click();
            }else if(ev.key == '2' || ev.key == 'a'){
                btnAyuda.click();
            }
        }
    });

}

window.addEventListener('load', on_load);
