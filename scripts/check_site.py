"""Validate the published HTML pages and their local links without dependencies."""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://abdullaho21.github.io/"


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.errors = []
        self.lang = False
        self.viewport = False
        self.title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "html":
            self.lang = bool(attrs.get("lang"))
        if tag == "meta" and attrs.get("name") == "viewport":
            self.viewport = True
        if tag == "title":
            self.title = True
        if tag == "img" and "alt" not in attrs:
            self.errors.append("image is missing an alt attribute")
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])
        if tag == "meta" and attrs.get("property") == "og:image":
            self.links.append(attrs.get("content", ""))


def main():
    # Only the published pages belong to this check, never generated/tool folders.
    paths = [ROOT / name for name in (
        "index.html", "404.html", "jarvis/index.html",
        "arabic-localization/index.html", "gravity-rush/index.html",
    )]
    pages = {}
    errors = []
    for path in paths:
        if not path.is_file():
            errors.append(f"missing page: {path.relative_to(ROOT)}")
            continue
        page = Page()
        page.feed(path.read_text(encoding="utf-8"))
        pages[path] = page

    references = 0
    for path, page in pages.items():
        label = path.relative_to(ROOT)
        for field in ("lang", "viewport", "title"):
            if not getattr(page, field):
                page.errors.append(f"missing {field}")
        for identifier, count in Counter(page.ids).items():
            if count > 1:
                page.errors.append(f"duplicate id: {identifier}")
        for reference in page.links:
            url = urlsplit(urljoin(ORIGIN + label.as_posix(), reference))
            if url.scheme not in ("http", "https") or url.netloc != urlsplit(ORIGIN).netloc:
                continue
            target = (ROOT / unquote(url.path.lstrip("/"))).resolve()
            if not target.is_relative_to(ROOT):
                page.errors.append(f"link escapes the published site: {reference}")
                continue
            if target.is_dir():
                target /= "index.html"
            references += 1
            if not target.is_file():
                page.errors.append(f"missing link target: {reference}")
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                page.errors.append(f"missing anchor: {reference}")
        errors.extend(f"{label}: {error}" for error in page.errors)

    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Validated {len(pages)} pages and {references} local references; metadata, IDs and image alt attributes passed.")


if __name__ == "__main__":
    main()
