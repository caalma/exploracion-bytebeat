import ByteBeatNode from './ByteBeat.module.js';
import { convertBytesToHex, convertHexToBytes } from './utils.js';
import { copiarAlPortapapeles } from  './comun.js';

let g_context,
    g_byteBeat,
    g_playing = false,
    g_rate = 8000,
    g_code_l = '', // para sonido stereo, a futuro
    g_code_r = '', // para sonido stereo, a futuro
    g_code_actual = '',
    g_debug = false;

function a_consola(...args){
    if(g_debug) console.log(...args);
}

function getQueryGreggmanStyle(fn=()=>{}) {
    compressor.compress(
        g_code_actual.trim(), 1,
        function(bytes) {
            const params = new URLSearchParams({
                t: g_byteBeat.getType(),
                e: g_byteBeat.getExpressionType(),
                s: g_byteBeat.getDesiredSampleRate(),
                bb: convertBytesToHex(bytes),
            });
            fn(`#${params.toString()}`);
        },
        ()=>{}
    );
}

async function init() {
    g_context = new AudioContext();
    ByteBeatNode.setup(g_context).then(e => {
        g_byteBeat = new ByteBeatNode(g_context);
        g_byteBeat.setType(ByteBeatNode.Type.byteBeat);
        g_byteBeat.setExpressionType(ByteBeatNode.ExpressionType.postfix);
        g_byteBeat.setDesiredSampleRate(parseInt(g_rate));
        updateCode().then(e => {
            a_consola('updateCode en init', e);
        });
    });
}

async function reinit() {
    if (g_playing) {
        g_playing = false;
        g_byteBeat.disconnect();
        init().then( e => {
            console.log('init TRUE, en reinit', e)
            g_playing = true;
            setTimeout(()=>{
                g_byteBeat.connect(g_context.destination);
            }, 300);
        });
    }else{
        init().then(e => {
            a_consola('init FALSE, en reinit', e)
        });
    }
}


async function info() {
    console.log({
        'gbb': g_byteBeat,
        'rate': g_byteBeat.getDesiredSampleRate(),
        'time': g_byteBeat.getTime(),
        'type': g_byteBeat.getType(),
        'n_channles': g_byteBeat.getNumChannels(),
        'expresion_type': g_byteBeat.getExpressionType(),
    });
}

async function updateCode() {
    if (g_context) {
        let codes = g_code_r === undefined ? [g_code_l] : [g_code_l, g_code_r];
        if(g_byteBeat){
            g_byteBeat.setExpressions(codes)
                .then(e => {
                    a_consola('updateCode interno', e);
                })
                .catch(e => {
                    a_consola('updateCode interno error', e);
                });
        }
    }
}

async function asyncSetCode(cl, cr) {
    g_code_l = cl;
    g_code_r = cr;
    await updateCode();
}

async function asyncSetRate(rt) {
    g_rate = rt;
    await reinit();
}

async function asyncPlayPause() {
    const aplicar = () => {
        if(g_byteBeat){
            if (!g_playing) {
                g_byteBeat.connect(g_context.destination);
            } else {
                g_byteBeat.disconnect();
            }
        }
        g_playing = !g_playing;
    }

    if (!g_context) {
        init().then(e=>{
            a_consola('init sin g_context, en playPause', e);
            aplicar();
        });
    }else{
        aplicar();
    }
}

function configureExternalsApp(){
    setTimeout(()=>{
        getQueryGreggmanStyle(query => {
            let elementos = document.querySelectorAll('.external-app');
            if(query !== 'None' || query !== undefined){
                elementos.forEach(elem => {
                    elem.setAttribute('href', elem.getAttribute('data-site') + query);
                    elem.classList.add('btn-success', 'titilar');
                    elem.classList.remove('btn-secondary');
                    setTimeout(() => {
                        elem.classList.remove('titilar');
                    }, 1000);
                });
            }else{
                elementos.forEach(elem => {
                    elem.classList.add('btn-secondary');
                    elem.classList.remove('btn-success');
                });
            }
        });
    }, 200);
}

function setCodeActual(elem){
    let cAct = 'code-actual';
    codes.forEach(e => {
        e.parentElement.classList.remove(cAct);
    });
    elem.parentElement.classList.add(cAct);
    g_rate = parseInt(elem.parentElement.querySelector('[name=rate]').value);
    try {
       asyncSetRate(g_rate);
    } catch (err) { }
    g_code_actual = elem.textContent;
    asyncSetCode(g_code_actual);
}

function isCodeActual(elem){
    let cAct = 'code-actual';
    return elem.parentElement.classList.contains(cAct);
}

function notificar(texto, ocultar=true){
    let cAct = 'activa';
    notificacion.innerHTML = texto;
    notificacion.classList.add(cAct);
    if(ocultar){
        setTimeout(()=>{
            notificacion.classList.remove(cAct);
        }, 700);
    }
}

function loopRender() {
		requestAnimationFrame(loopRender);
		if (g_playing) showTime();
	}

async function showTime (){
	let time = g_byteBeat.getTime();
    notificar(`<small>t -></small> <span>${time}</span>`, false);
};


var codes;

function on_load (ev) {

    window.bb = { // interfaz pública
        'init': init,
        'reinit': reinit,
        'setCode': asyncSetCode,
        'setRate': asyncSetRate,
        'playPause': asyncPlayPause,
        'info': info,
        'getQueryGreggmanStyle': getQueryGreggmanStyle,
        'isplay': () => g_playing,
        'byteBeat': g_byteBeat,
        'context': g_context,
    };

    let btnPlayPause = document.querySelector('[name=play-pause]');
    let inputRate = document.querySelectorAll('[name=rate]');
    let elemsCopiar = document.querySelectorAll('.copiar');
    let notificacion = document.querySelector('#notificacion');
    let btnPortada = document.querySelector('[name=a_portada]');
    let btnAyuda = document.querySelector('[name=a_ayuda]');
    codes = document.querySelectorAll('code');

    loopRender();

    let setBtnPlayPause = () => {
        setTimeout(()=>{
            if(g_playing){
                btnPlayPause.classList.add('btn-danger');
                btnPlayPause.classList.remove('btn-warning');
            }else{
                btnPlayPause.classList.add('btn-warning');
                btnPlayPause.classList.remove('btn-danger');
            }
        }, 200);
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
            asyncPlayPause();
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
