/*
  Local-only staging utility. This package supplies edition leads, not source files.
  Usage: node DEI_Iberofonia_Apply_Approved_Assets.mjs seed.json approved-assets.json staged-with-assets.json
  It neither retrieves external pages nor deploys. Run after an editor has approved
  each exact edition under U.S. law, obtained the file, and verified all pages.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const [seedPath, manifestPath, dest] = process.argv.slice(2);
assert.ok(seedPath && manifestPath && dest, 'Usage: seed.json approved-assets.json staged-with-assets.json');
assert.ok(path.resolve(seedPath) !== path.resolve(dest), 'Keep the reviewed seed intact');
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const seed = readJSON(seedPath), manifest = readJSON(manifestPath);
assert.equal(seed.schema_version, '3.0');
assert.equal(seed.works.length, 80);
assert.equal(manifest.schema_version, '1.0');
assert.ok(Array.isArray(manifest.assets));
const folder = fs.realpathSync(path.dirname(path.resolve(manifestPath)));
const editions = new Map(seed.works.flatMap(w => w.editions.map(e => [e.id, [w,e]])));
const seen = new Set();
const requested = new Set(seed.display_languages);
const roles = new Set(['US_PUBLIC_DOMAIN_95', 'US_PUBLIC_DOMAIN_OTHER_DOCUMENTED', 'PERMISSION_DOCUMENTED']);
const esc = x => x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const requiredString = s => typeof s === 'string' && s.trim().length > 0;

function bytes(relative, ext){
  assert.ok(requiredString(relative) && !path.isAbsolute(relative), 'Use a relative local file');
  const r = fs.realpathSync(path.resolve(folder, relative));
  assert.ok(!path.relative(folder,r).startsWith('..') && r !== folder, 'Asset must be under the manifest directory');
  assert.ok(r.toLowerCase().endsWith(ext) && fs.statSync(r).isFile(), 'Unexpected asset type');
  return fs.readFileSync(r);
}

function sitePath(url){
  return typeof url === 'string' && /^\/(?![\/\\])[\w./?=%&#-]+$/.test(url)
    && !url.includes('..') && !url.includes('%2f') && !url.includes('%2F');
}

function html(input, lang){
  assert.ok(!input.includes('\uFFFD') && !input.includes('\x00'), 'Use proofed UTF-8 text');
  const blocks = input.trim().split(/\r?\n\s*\r?\n+/);
  assert.ok(blocks.length && input.trim().length > 0, 'Empty text');
  let section = 0;
  return '<div class="primary-text" lang="' + lang + '">' + blocks.map(raw => {
    const t=raw.trim();
    if (/^## [^\n]+$/.test(t)) return '<h2 id="text-section-' + (++section) + '">' + esc(t.slice(3)) + '</h2>';
    return '<p>' + esc(t).replace(/\r?\n/g, ' ') + '</p>';
  }).join('\n') + '</div>';
}

for (const a of manifest.assets){
  assert.ok(editions.has(a.edition_id), 'Unknown edition ' + a.edition_id);
  const [w,e] = editions.get(a.edition_id);
  assert.ok(requested.has(a.language) && e.languages.includes(a.language), 'Work/edition/language mismatch');
  const key = a.edition_id+'-'+a.language;
  assert.ok(!seen.has(key), 'Duplicate attachment ' + key);
  seen.add(key);
  assert.ok(a.approved === true && roles.has(a.rights_basis), 'Approval and documented U.S. rights basis required');
  assert.ok(['approver','approval_date','rights_evidence','edition_credit','complete_span'].every(k=>requiredString(a[k])),
    'Complete edition, scope and approval evidence required');
  assert.match(a.approval_date, /^\d{4}-\d{2}-\d{2}$/);
  if (a.rights_basis === 'US_PUBLIC_DOMAIN_95'){
    assert.ok(Number.isInteger(a.edition_publication_year)
      && a.edition_publication_year <= seed.copyright.cutoff_year_as_of_2026,
      'Publication year must satisfy the 2026 U.S. 95-year rule');
  }
  assert.ok(['complete_html','complete_pdf','complete_multipart','complete_in_collection','complete_viewer',
    'facsimile','commercial','restricted','edition_record'].includes(e.extent), 'Not a complete edition route');
  assert.ok(['html','pdf'].includes(a.kind), 'Choose html or pdf');
  const content = bytes(a.local_file, a.kind==='html' ? '.txt' : '.pdf');
  const digest = crypto.createHash('sha256').update(content).digest('hex');
  if (a.sha256) assert.equal(digest, a.sha256, 'Asset mismatch');
  const pub = {
    language:a.language,kind:a.kind,source_sha256:digest,edition_credit:a.edition_credit,
    complete_span:a.complete_span,us_review:{
      basis:a.rights_basis,evidence:a.rights_evidence,reviewed_by:a.approver,date:a.approval_date,
      edition_publication_year:a.edition_publication_year??null
    }
  };
  if (a.kind === 'html') {
    pub.html = html(content.toString('utf8'),a.language);
  } else {
    assert.ok(content.subarray(0,5).toString() === '%PDF-', 'PDF signature missing');
    assert.ok(sitePath(a.viewer_url) && sitePath(a.download_url), 'Use distinct same-site PDF viewer/download URLs');
    assert.notEqual(a.viewer_url,a.download_url,'Separate viewer and download actions');
    pub.viewer_url=a.viewer_url;
    pub.download_url=a.download_url;
  }
  if (!e.local_assets) e.local_assets={};
  e.local_assets[a.language]=pub;
  e.rights_approved=true;
  e.render_mode = a.kind==='html' ? 'inline_html' : 'local_pdf';
  const panel=w.reading.find(p=>p.language===a.language);
  assert.ok(panel,'Missing language panel');
  panel.on_site_edition_id=e.id;
  if (a.language==='en'){
    w.english_state='hosted_edition';
    w.translation_request=null;
  }
}
seed.release='editorial_staging_with_approved_assets';
fs.writeFileSync(dest, JSON.stringify(seed,null,2)+'\n', {flag:'wx'});
console.log(`${seed.works.length} drafts; ${seen.size} approved language assets. No site write performed.`);
