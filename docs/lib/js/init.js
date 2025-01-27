//import ByteBeatNode from 'https://greggman.github.io/html5bytebeat/dist/2.x/ByteBeat.module.js';
import ByteBeatNode from './ByteBeat.module.js';
import compressor from './compressor.js';

import {
  convertBytesToHex,
  convertHexToBytes,
  makeExposedPromise,
  splitBySections,
  s_beatTypes,
  s_expressionTypes,
} from './utils.js';


let doNotSetURL = false;
let g_ignoreHashChange;
let g_context;
let g_byteBeatNode;
let g_playing = false;
let g_bb_rate = 8000;
let g_bb_code_l = '';
let g_bb_code_r = '';
let g_actual_code = '';

function getURL(fn=()=>{}) {
    compressor.compress(g_bb_code_l, 1,
                        function(bytes) {
                            const hex = convertBytesToHex(bytes);
                            g_ignoreHashChange = true;
                            const vNdx = 0;
                            const params = new URLSearchParams({
                                t: g_byteBeatNode.getType(),
                                e: g_byteBeatNode.getExpressionType(),
                                s: g_byteBeatNode.getDesiredSampleRate(),
                                ...(vNdx > 2 && {v: ''}),
                                bb: hex,
                            });
                            fn(`#${params.toString()}`);
                        },
                        ()=>{}
                       );
}

async function init() {
    g_context = new AudioContext();
    await ByteBeatNode.setup(g_context);
    g_byteBeatNode = new ByteBeatNode(g_context);
    g_byteBeatNode.setType(ByteBeatNode.Type.byteBeat);
    g_byteBeatNode.setExpressionType(ByteBeatNode.ExpressionType.postfix);
    g_byteBeatNode.setDesiredSampleRate(parseInt(g_bb_rate));
    updateCode();
}

async function reinit() {
    if (g_playing) {
        g_playing = false;
        g_byteBeatNode.disconnect();
        await init();
        g_playing = true;
        g_byteBeatNode.connect(g_context.destination);
    }else{
        await init();
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
        await g_byteBeatNode.setExpressions(codes);
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

async function playPause() {
    if (!g_context) { await init(); }
    if (!g_playing) {
        g_playing = true;
        g_byteBeatNode.connect(g_context.destination);
    } else {
        g_playing = false;
        g_byteBeatNode.disconnect();
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

function configureBtnExternalApp(query){
    let elems = document.querySelectorAll('[name=externalApp]');
    if(query !== 'None'){
        elems.forEach(elem => {
            elem.classList.add('btn-success');
            elem.classList.remove('btn-secondary');
            let url = elem.getAttribute('data-site') + query;
            elem.setAttribute('href', url);
        });
    }else{
        elems.forEach(elem => {
            elem.classList.add('btn-secondary');
            elem.classList.remove('btn-success');
        });
    }
}

window.addEventListener('load', ev => {
    let bb = {
        'setCode': asyncSetCode,
        'setRate': asyncSetRate,
        'playPause': playPause,
        'info': info,
        'reinit': reinit,
        'getURL': getURL,
        'isplay': () => g_playing,
    };

    window.bb = bb;

    let btnPlayPause = document.querySelector('[name=play-pause]');
    let inputRate = document.querySelectorAll('[name=rate]');

    let playPauseActivate = () => {
        btnPlayPause.classList.remove('btn-secondary');
        btnPlayPause.classList.add('btn-warning');
    };

    document.querySelectorAll('.copiar').forEach(elem => {
        elem.addEventListener('click', ev => {
            copiarAlPortapapeles(elem.innerText);
            elem.classList.add('copiado');
            setTimeout(()=>{
                elem.classList.remove('copiado');
            }, 700);
        });
    });

    btnPlayPause.addEventListener('click', e => {
        let elem = btnPlayPause;

        if(elem.classList.contains('btn-secondary')){
            return;
        }

        bb.playPause();
        bb.setCode(g_actual_code);
        if(bb.isplay()){
            elem.classList.add('btn-danger');
            elem.classList.remove('btn-warning');
        }else{
            elem.classList.add('btn-warning');
            elem.classList.remove('btn-danger');
        }
    });

    document.querySelectorAll('code').forEach(elem => {
        ['click', 'change'].forEach(evType => {
            elem.addEventListener(evType, ev => {
                g_bb_rate = parseInt(elem.parentElement.querySelector('[name=rate]').value);
                try {
                    bb.setRate(g_bb_rate);
                } catch(err) { }
                g_actual_code = elem.textContent;
                bb.setCode(g_actual_code);

                configureBtnExternalApp(elem.getAttribute('data-query_greggman'));
                playPauseActivate();
            });
        });
    });

    inputRate.forEach(elem => {
        ['change', 'click', 'keydown'].forEach(evType => {
            elem.addEventListener(evType, ev => {
                bb.setRate(parseInt(elem.value));
            });
        });
    });
})
