from pathlib import Path
import fitz

out = Path('../output/pdf')
for name in ['makkah-discovery-A3', 'makkah-agenda-A3']:
    path = out / (name + '.pdf')
    doc = fitz.open(path)
    doc[0].set_mediabox(fitz.Rect(0, 0, 297 * 72 / 25.4, 420 * 72 / 25.4))
    data = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    path.write_bytes(data)
source = fitz.open(out / 'makkah-agenda-A3.pdf')
result = fitz.open()
page = result.new_page(width=210 * 72 / 25.4, height=297 * 72 / 25.4)
page.show_pdf_page(page.rect, source, 0)
scale = 210 / 297
for link in source[0].get_links():
    if link.get('uri'):
        r = link['from']
        page.insert_link({'kind': fitz.LINK_URI, 'from': fitz.Rect(r.x0*scale, r.y0*scale, r.x1*scale, r.y1*scale), 'uri': link['uri']})
result.save(out / 'makkah-agenda-A4.pdf', garbage=4, deflate=True)
Path('public/agenda.pdf').write_bytes((out / 'makkah-agenda-A4.pdf').read_bytes())
for name in ['makkah-discovery-A3', 'makkah-agenda-A3', 'makkah-agenda-A4']:
    doc = fitz.open(out / (name + '.pdf'))
    doc[0].get_pixmap(matrix=fitz.Matrix(1,1)).save('tmp/verification/' + name + '-render.png')
    print(name, 'pages:', len(doc), 'mm:', tuple(round(v*25.4/72,2) for v in (doc[0].rect.width, doc[0].rect.height)))
