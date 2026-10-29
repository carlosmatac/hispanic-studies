#!/usr/bin/env python3
"""Turn the canon into the archive's content files (site/content/archive/<id>.md).

Since 2026-10-29 (issue #68) the canon is an *archive of Hispanic thought*: one
Markdown file per work, its record in the YAML frontmatter and, when the work
is in the public domain, its full text as the body. The files are edited by
hand or in the CMS (/keystatic, issue #69), so **this script is a one-off**:
it wrote the first version of the fifty files from the compiler's data and
refuses to overwrite a file that exists (pass --force to rebuild one on
purpose, e.g. `--force T012`). Full texts are added by tools/ingest-text.py; the rights
research is applied by tools/apply-archive-research.mjs.
It writes the YAML as JSON-style values; the committed files were then put in
the CMS's own YAML style (what Keystatic writes when it saves), so a first
save from /keystatic changes only what was edited.

What it carries over from the compiler's JSON, as tools/build-canon-works.py
did before it: the title (without the trailing year), the year, the author
under the name they are known by (NAMES), the life dates, places, country code,
camp, position, Bueno class and the counter-tradition flag.

What it adds:
- region: the colour of the card (REGION below), by where the author worked or
  what the text is about. Six regions, Beltrán's list: Spain, South America,
  North America (Mexico and Central America), the Caribbean, the Lusophone
  world (Portugal, Brazil, Lusophone Africa) and Ibero-Asia.
- period: the box, by year (lib/canon.ts PERIODS), now with a prelude.
- language of the text, and rights = "unverified" until checked.
- the prelude's first two works (EXTRA), which are not in the compiler's list.

Only real data: the extra works and the overrides are dated from the editions
themselves (the scans linked in each file).
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/provided-documentation/Hispanic_Reunification_Canon_data.json'
OUT = ROOT / 'site/content/archive'

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

# The country code on the card → region. Central America and Panama go with
# Mexico as North America (the continent's own division); Venezuela and
# Colombia, though on the Caribbean sea, with South America; Lusophone Africa
# with the Lusophone world. Per-work exceptions are in REGION_BY_ID.
REGION_BY_CODE = {
    'ES': 'spain',
    'AR': 'south-america', 'BO': 'south-america', 'CL': 'south-america', 'CO': 'south-america',
    'EC': 'south-america', 'PE': 'south-america', 'UY': 'south-america', 'VE': 'south-america',
    'MX': 'north-america', 'HN': 'north-america', 'PA': 'north-america', 'CR': 'north-america',
    'NI': 'north-america', 'SV': 'north-america',
    'CU': 'caribbean', 'PR': 'caribbean', 'DO': 'caribbean',
    'PT': 'lusophone', 'BR': 'lusophone', 'AO': 'lusophone', 'CV': 'lusophone', 'GW': 'lusophone',
    'PH': 'ibero-asia', 'GOA': 'ibero-asia',
}
REGION_BY_ID = {
    # Donato Ndongo wrote it in exile in Spain (published in Barcelona); Spanish-speaking
    # Africa has no region of its own in Beltrán's six, so the work sits with Spain.
    'T048': 'spain',
}

# The language each text was written in (default Spanish).
LANGUAGE_BY_ID = {
    'T007': 'pt', 'T010': 'pt', 'T011': 'pt', 'T020': 'pt', 'T027': 'pt', 'T039': 'pt',
    'T043': 'pt', 'T044': 'pt', 'T050': 'pt',
    'T042': 'fr',  # Qu'est-ce que le luso-tropicalisme? (Paris, 1955)
    'T047': 'pt',  # the compiler gives the title in English and Portuguese; the reader shows the language only with a text
    'T049': 'en',  # Nick Joaquín, Culture and History (Manila, 1988)
}

PERIODS = [('prelude', 1492, 1799), ('independence', 1800, 1870), ('ninety-eight', 1871, 1900),
           ('continent', 1901, 1930), ('hispanidad', 1931, 1960), ('after-empire', 1961, 2000)]

# Corrections to the compiler's data, each with its reason.
OVERRIDES = {
    # The letter is dated "Kingston, 6 de septiembre de 1815"; 1818 is the year of its
    # first printing, in English. Beltrán dates it 1815 too.
    'T001': {
        'year': 1815,
        'noteEn': 'Dated Kingston, 6 September 1815. It was first printed in English in 1818; the Spanish text is the one Francisco Javier Yanes published in Caracas in 1833.',
        'noteEs': 'Fechada en Kingston el 6 de septiembre de 1815. Se imprimió por primera vez en inglés en 1818; el texto español es el que publicó Francisco Javier Yanes en Caracas en 1833.',
    },
}

# The prelude (Beltrán, 2026-10-29): the Empire's own thought, before 1818.
EXTRA = [
    {
        'id': 'vitoria-de-indis',
        'title': 'Relectio de Indis',
        'author': 'Francisco de Vitoria',
        'fullName': 'Francisco de Vitoria',
        'life': 'c. 1483–1546',
        'year': 1539,
        'region': 'spain',
        'place': 'Spain (Salamanca)',
        'code': 'ES',
        'language': 'la',
        'rights': 'public-domain',
        'noteEn': 'Lectures given at the University of Salamanca in 1539, first printed in Lyon in 1557 in his Relectiones. The text is in Latin; the archive will host a Spanish translation only if the translation is itself in the public domain.',
        'noteEs': 'Lecciones dictadas en la Universidad de Salamanca en 1539 e impresas por primera vez en Lyon en 1557, en sus Relectiones. El texto está en latín; el archivo solo alojará una traducción española si la propia traducción es de dominio público.',
        'links': [
            {'label': 'Relectiones theologicae XII, Lyon: Jacques Boyer, 1557 (first edition; De Indis in vol. 1, pp. 282–374). John Carter Brown Library scan, Internet Archive',
             'url': 'https://archive.org/details/reverendipatrisf00vito'},
            {'label': 'De Indis et De iure belli relectiones, ed. Ernest Nys, Latin with an English translation by John Pawley Bate. Washington: Carnegie Institution, 1917. Internet Archive',
             'url': 'https://archive.org/details/franciscidevicto0000vito'},
        ],
    },
    {
        'id': 'las-casas-brevisima',
        'title': 'Brevísima relación de la destrucción de las Indias',
        'author': 'Bartolomé de las Casas',
        'fullName': 'Bartolomé de las Casas',
        'life': '1484–1566',
        'year': 1552,
        # He worked for decades in the Caribbean (Hispaniola, Cuba) before Chiapas, and
        # the relation opens with the islands.
        'region': 'caribbean',
        'place': 'Hispaniola; Cuba; Guatemala; Chiapas; Spain',
        'code': 'ES',
        'language': 'es',
        'rights': 'public-domain',
        'noteEn': 'Written in 1542 for the future Philip II and printed in Seville in 1552. The full text will be transcribed from an early edition: Wikisource only has the opening of a reworked version from 1822.',
        'noteEs': 'Escrita en 1542 para el futuro Felipe II e impresa en Sevilla en 1552. El texto completo se transcribirá de una edición antigua: Wikisource solo tiene el comienzo de una versión rehecha de 1822.',
        'links': [
            {'label': 'First edition, Seville: Sebastián Trujillo, 1552. John Carter Brown Library scan, Internet Archive',
             'url': 'https://archive.org/details/breuissimarelaci00casa'},
            {'label': 'Cádiz: Sincera Unión, 1821. Universidad de Sevilla scan, Internet Archive',
             'url': 'https://archive.org/details/HFA901243'},
        ],
    },
]

# The order of the keys in every file (the CMS's own order, keystatic.config.ts).
KEYS = ['title', 'author', 'fullName', 'life', 'year', 'period', 'region', 'place', 'code', 'language',
        'rights', 'counter', 'camp', 'position', 'buenoCode', 'buenoName', 'noteEn', 'noteEs',
        'summaryEn', 'summaryEs', 'sourceEdition', 'sourceUrl', 'sourceRevision', 'sourceLicence', 'links']


def yaml_value(v):
    # JSON is valid YAML: strings come out double-quoted and safe
    return json.dumps(v, ensure_ascii=False)


def frontmatter(entry):
    lines = []
    for k in KEYS:
        v = entry.get(k)
        if v in (None, '', [], False) and k not in ('year',):
            continue
        if k == 'links':
            lines.append('links:')
            for link in v:
                lines.append(f'  - label: {yaml_value(link["label"])}')
                lines.append(f'    url: {yaml_value(link["url"])}')
        else:
            lines.append(f'{k}: {yaml_value(v)}')
    return '---\n' + '\n'.join(lines) + '\n---\n'


def period_for(year):
    return next(p for p, a, b in PERIODS if a <= year <= b)


def main():
    force = set(sys.argv[sys.argv.index('--force') + 1:]) if '--force' in sys.argv else set()
    d = json.loads(SRC.read_text())
    authors = {a['id']: a for a in d['authors']}
    bands = {c['code']: c['name'] for c in d['bueno_classes']}
    entries = []
    for t in d['texts']:
        a = authors[t['author_id']]
        short = a.get('short_name') or a['name']
        code = a.get('region_code', '')
        e = {
            'id': t['id'],
            'title': re.sub(r'\s*\(\d{4}[^)]*\)\s*$', '', t['title']).strip(),
            'author': NAMES.get(t['author_id'], NAMES.get(short, short)),
            'fullName': a['name'],
            'life': a.get('life_dates', ''),
            'year': t['year'],
            'region': REGION_BY_ID.get(t['id']) or REGION_BY_CODE[code],
            'place': a.get('region', ''),
            'code': code,
            'language': LANGUAGE_BY_ID.get(t['id'], 'es'),
            'rights': 'unverified',
            'counter': a.get('role') == 'counter-tradition',
            'camp': a.get('camp', ''),
            'position': a.get('position', ''),
            'buenoCode': t['bueno_class'],
            'buenoName': bands.get(t['bueno_class'], ''),
        }
        e.update(OVERRIDES.get(t['id'], {}))
        entries.append(e)
    entries += EXTRA
    OUT.mkdir(parents=True, exist_ok=True)
    wrote = kept = 0
    for e in entries:
        e['period'] = period_for(e['year'])
        path = OUT / f'{e["id"]}.md'
        if path.exists() and e['id'] not in force and 'all' not in force:
            kept += 1
            continue
        path.write_text(frontmatter(e))
        wrote += 1
    counts = {p: sum(e['period'] == p for e in entries) for p, _, _ in PERIODS}
    regions = {}
    for e in entries:
        regions[e['region']] = regions.get(e['region'], 0) + 1
    print(f'{OUT.relative_to(ROOT)}: wrote {wrote}, kept {kept} existing;', counts, regions)


if __name__ == '__main__':
    main()
