#!/usr/bin/env python
# -*- coding:utf-8 -*-

import webbrowser
from livereload import Server, shell
from actualizar import actualizar_todo

def main():
    # actualizar documentos estáticos
    actualizar_todo('local')

    # variables básicas
    h, p, l = '127.0.0.1', 8099, 35729

    # apertura en navegador predeterminado local
    webbrowser.open(f'http://{h}:{p}')

    # definicion del server
    server = Server()

    # documentos donde considerar cambios automáticos
    server.watch('./datos/', shell('./actualizar.py local'))
    server.watch('./plantillas/html/', shell('./actualizar.py local'))
    server.watch('./plantillas/css/', shell('lessc ./plantillas/css/estilo.less', output='../docs/lib/css/estilo.css'))
    server.watch('../docs/lib/', shell(''))
    server.watch('../docs/lib/css/', shell(''))
    server.watch('../docs/lib/js/', shell(''))

    # cabeceras generales locales
    server.setHeader('Access-Control-Allow-Origin', '*')
    server.setHeader('Access-Control-Allow-Methods', '*')

    # activación del server
    server.serve(root='../docs/', liveport=l, host=h, port=p)

if __name__ == '__main__':
    main()
