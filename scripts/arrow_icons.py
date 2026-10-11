"""Keep decorative arrows independent of the device's emoji font."""
from html.parser import HTMLParser
import re

PATHS = {
    '↗': 'M5 19 19 5M5 5h14v14',
    '←': 'M20 12H4m7-7-7 7 7 7',
    '→': 'M4 12h16m-7-7 7 7-7 7',
    '↑': 'M12 20V4m-7 7 7-7 7 7',
    '⤢': 'M9 15 4 20m0-6v6h6M15 9l5-5m-6 0h6v6',
}
ARROWS = re.compile(r'[↗←→↑⤢][\ufe0e\ufe0f]?')

def svg(symbol):
    return ('<svg class="arrow-icon" viewBox="0 0 24 24" width="24" height="24" '
            'aria-hidden="true" focusable="false" fill="none" stroke="currentColor" '
            'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{PATHS[symbol[0]]}"></path></svg>')

class IconParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.output = []
        self.interactive = 0
    def handle_starttag(self, tag, attrs):
        self.output.append(self.get_starttag_text())
        if tag in ('a', 'button'): self.interactive += 1
    def handle_endtag(self, tag):
        self.output.append(f'</{tag}>')
        if tag in ('a', 'button'): self.interactive = max(0, self.interactive - 1)
    def handle_startendtag(self, tag, attrs): self.output.append(self.get_starttag_text())
    def handle_data(self, text):
        self.output.append(ARROWS.sub(lambda match: svg(match[0]), text) if self.interactive else text)
    def handle_entityref(self, name): self.output.append('&' + name + ';')
    def handle_charref(self, name): self.output.append('&#' + name + ';')
    def handle_comment(self, text): self.output.append('<!--' + text + '-->')
    def handle_decl(self, text): self.output.append('<!' + text + '>')

def replace_arrows(content):
    parser = IconParser()
    parser.feed(content)
    return ''.join(parser.output)
