#!/usr/bin/env python3
# -*- coding:utf-8 -*-


from os import listdir, makedirs
from os.path import splitext, dirname, exists
from pathlib import Path
from time import gmtime, strftime, time_ns
from shutil import rmtree
import json
import yaml
from jinja2 import Environment, FileSystemLoader
from markdown import Markdown
from markdown.inlinepatterns import SimpleTagInlineProcessor
from markdown.extensions import Extension
from random import shuffle

# ------ funciones generales
def md_a_html(texto):
    global dat_cfg
    global env_jinja2
    tpl = env_jinja2.from_string(texto)
    texto = tpl.render(cfg=dat_cfg)
    md = Markdown(extensions=markdown_extensiones, extension_configs=markdown_extensiones_config)
    return md.convert(texto)

def url_dominio(texto):
    return texto.split(':')[1].strip('/')

def borrar_contenido(ruta):
    if exists(ruta):
        for sr in listdir(ruta):
            pa = Path(f'{ruta}{sr}')
            if pa.is_dir():
                rmtree(pa)

def leer_yml(ar):
    with open(ar, 'r') as f:
        return yaml.safe_load(f)


def actualizar_paginas():
    # completado de plantillas de PÁGINAS
    ruta_in = './datos/paginas/'
    ruta_out = f'{ruta_public}pag/'
    borrar_contenido(ruta_out)

    for ar in [a for a in listdir(ruta_in) if a.endswith('.yml')]:
        print('Página: ', ar)

        dat_cfg['actualizacion'] = strftime("%Y-%m-%d %H:%M:%S", gmtime())
        dat_cfg['cache_actu'] = int(time_ns() / 1000)
        dat_pag = leer_yml(f'{ruta_in}{ar}')

        if dat_pag['ruta_static']:

            arc_out = ruta_public + dat_pag['ruta_static']
            makedirs(dirname(arc_out), exist_ok=True)

            tpl = env_jinja2.get_template(dat_pag['html_base'])
            html = tpl.render(cfg=dat_cfg, pag=dat_pag)

            with open(arc_out, 'w') as f:
                f.write(html)


def actualizar_todo():
    actualizar_paginas()
    # finalización
    print('--- Actualización completada!')


# ------ configuracion general
markdown_extensiones = [ 'tables', 'attr_list', 'toc', 'abbr', 'footnotes' ]
markdown_extensiones_config = { 'tables': {}, 'attr_list': {}, 'toc': {}, 'abbr': {}, 'footnotes': {}}

ruta_public = '../docs/'

ar_cfg_in = './datos/configuracion.yml'

with open(ar_cfg_in, 'r') as f:
    dat_cfg = yaml.safe_load(f)


# ------  completado de plantillas
fl = FileSystemLoader('plantillas')
env_jinja2 = Environment(loader=fl)

env_jinja2.globals.update(markdown = md_a_html)
env_jinja2.globals.update(url_dominio = url_dominio)


if __name__ == '__main__':
    actualizar_todo()
