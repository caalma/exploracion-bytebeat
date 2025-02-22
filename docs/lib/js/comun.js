export function copiarAlPortapapeles(texto) {
     if (navigator.clipboard && window.isSecureContext) {
         return navigator.clipboard.writeText(texto).then(() => {
             //console.info('Copiado al portapapeles');
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
             //console.info('Copiado al portapapeles');
         }).catch(err => {
             console.error('Error al copiar al portapapeles: ', err);
         });
     }
}

export function atajosDeTeclado(acciones={}, ev=undefined) {
    const alt = ev.altKey ? 'A+' : '';
    const ctrl = ev.ctrlKey ? 'C+' : '';
    const shift = ev.shiftKey ? 'S+' : '';
    const k = ctrl+alt+shift+ev.key;
    if(acciones.hasOwnProperty(k)){
        console.log(k)
        acciones[k]();
    }
}
