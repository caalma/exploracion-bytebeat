#!/usr/bin/env python
# -*- coding:utf-8 -*-

from livereload import Server, shell
from os import chdir
import webbrowser
from actualizar import actualizar_todo

def main():

    # actualizar documentos estáticos
    actualizar_todo()

    # variables básicas
    h, p, l = '127.0.0.1', 8099, 35729
    url = f'http://{h}:{p}'

    # apertura en navegador predeterminado local
    webbrowser.open(url)

    # definicion del server
    server = Server()

    # documentos donde considerar cambios automáticos
    server.watch('./datos/', shell('./actualizar.py'))
    server.watch('./plantillas/', shell('./actualizar.py'))

    server.watch('./lib-css/', shell('lessc ./lib-css/estilo.less', output='../docs/lib/css/estilo.css'))

    server.watch('../docs/lib/', shell(''))
    server.watch('../docs/lib/css/', shell(''))
    server.watch('../docs/rec/', shell(''))

    # cabeceras generales locales
    server.setHeader('Access-Control-Allow-Origin', '*')
    server.setHeader('Access-Control-Allow-Methods', '*')

    # activación del server
    server.serve(root='../docs/', liveport=l, host=h, port=p)


if __name__ == '__main__':
    main()
