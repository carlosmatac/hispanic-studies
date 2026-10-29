#!/usr/bin/env python3
"""Build the canon as a list of works, grouped by period (site/data/canon-works.json).

Beltrán asked (2026-10-24) to drop the chronological chart for now and show the
canon the simple way, as a reference list of classic works in a few boxes, after
enriquedussel.com's "Obras clásicas del pensamiento latinoamericano". This keeps
the compiler's fifty texts and joins each to its author's record.

Names: the compiler's `short_name` keeps the first given name and the mother's
surname for many Spanish and Portuguese names ("Miguel y Jugo" for Miguel de
Unamuno y Jugo). NAMES below gives the name each author is known by, taken from
the full name in the same record; nothing else is changed.

Periods: the boxes are ours (dates only, no new claims); every text falls in
exactly one by its year.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/provided-documentation/Hispanic_Reunification_Canon_data.json'
OUT = ROOT / 'site/data/canon-works.json'

NAMES = {
    'A266': 'Simón Bolívar',
    'José Cecilio del Valle': 'José Cecilio del Valle',
    'Torres Caicedo': 'José María Torres Caicedo',
    'Juan Martínez': 'Juan León Mera',
    'Eugenio M. de Hostos': 'Eugenio María de Hostos',
    'Joaquim Martins': 'Oliveira Martins',
    'Miguel y Jugo': 'Miguel de Unamuno',
    'Ángel Ganivet García': 'Ángel Ganivet',
    'Riva-Agüero': 'José de la Riva-Agüero',
    'Franz Tamayo Solares': 'Franz Tamayo',
    'Francisco Rey': 'Francisco García Calderón',
    'Julián y Loyot': 'Julián Juderías',
    'Rafael y Crevea': 'Rafael Altamira',
    'Carlos Gagini Chavarría': 'Carlos Gagini',
    'J. C. Mariátegui': 'José Carlos Mariátegui',
    'José Vasconcelos Calderón': 'José Vasconcelos',
    'Vicente Mónico': 'Alberto Masferrer',
    'Antonio Pizarro': 'Antonio S. Pedreira',
    'Ramiro y Whitney': 'Ramiro de Maeztu',
    'Víctor Raúl Haya': 'Víctor Raúl Haya de la Torre',
    'María Zambrano Alarcón': 'María Zambrano',
    'Fernando Ortiz Fernández': 'Fernando Ortiz',
    'Jaime Eyzaguirre Gutiérrez': 'Jaime Eyzaguirre',
    'Leopoldo Zea Aguilar': 'Leopoldo Zea',
    'Baltasar da Silva': 'Baltasar Lopes',
    'Jorge A. Ramos': 'Jorge Abelardo Ramos',
    'Eduardo de Faria': 'Eduardo Lourenço',
    'Francisco Bilbao Barquín': 'Francisco Bilbao',
    'Justo Arosemena Quesada': 'Justo Arosemena',
}

PERIODS = [
    {'id': 'independence', 'from': 1800, 'to': 1870,
     'name': {'en': 'Independence and the first unions', 'es': 'La independencia y las primeras uniones'}},
    {'id': 'ninety-eight', 'from': 1871, 'to': 1900,
     'name': {'en': 'From Iberism to 1898', 'es': 'Del iberismo al 98'}},
    {'id': 'continent', 'from': 1901, 'to': 1930,
     'name': {'en': 'Ariel and the continent', 'es': 'Ariel y el continente'}},
    {'id': 'hispanidad', 'from': 1931, 'to': 1960,
     'name': {'en': 'Hispanidad, Indo-America, the Lusophone world', 'es': 'Hispanidad, Indoamérica, el mundo lusófono'}},
    {'id': 'after-empire', 'from': 1961, 'to': 2000,
     'name': {'en': 'After empire', 'es': 'Después del imperio'}},
]


def main():
    d = json.loads(SRC.read_text())
    authors = {a['id']: a for a in d['authors']}
    bands = {c['code']: c['name'] for c in d['bueno_classes']}
    works = []
    for t in d['texts']:
        a = authors[t['author_id']]
        short = a.get('short_name') or a['name']
        title = re.sub(r'\s*\(\d{4}[^)]*\)\s*$', '', t['title']).strip()
        works.append({
            'id': t['id'],
            'title': title,
            'year': t['year'],
            'author': NAMES.get(t['author_id'], NAMES.get(short, short)),
            'fullName': a['name'],
            'life': a.get('life_dates', ''),
            'region': a.get('region', ''),
            'code': a.get('region_code', ''),
            'counter': a.get('role') == 'counter-tradition',
            'camp': a.get('camp', ''),
            'position': a.get('position', ''),
            'bueno': {'code': t['bueno_class'], 'name': bands.get(t['bueno_class'], '')},
            'period': next(p['id'] for p in PERIODS if p['from'] <= t['year'] <= p['to']),
        })
    works.sort(key=lambda w: (w['year'], w['id']))
    out = {
        'note': 'Fifty texts from Hispanic_Reunification_Canon_data.json, each joined to its author record. '
                'Built by tools/build-canon-works.py; author names are the ones each is known by.',
        'periods': PERIODS,
        'works': works,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    counts = {p['id']: sum(w['period'] == p['id'] for w in works) for p in PERIODS}
    print(f'wrote {OUT.relative_to(ROOT)}: {len(works)} works', counts)


if __name__ == '__main__':
    main()
