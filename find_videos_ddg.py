import urllib.request
import re

def ddg_search(query):
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query + " site:youtube.com")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        # find v= tags
        videos = re.findall(r"v%3D([a-zA-Z0-9_-]{11})", html)
        if videos:
            for v in videos:
                try:
                    # test if embeddable
                    emb = urllib.request.urlopen("https://www.youtube.com/embed/" + v, timeout=2).read().decode('utf-8')
                    if "UNAVAILABLE" not in emb.upper():
                        return v
                except:
                    continue
        return None
    except Exception as e:
        return str(e)

print("Add:", ddg_search("khan academy adding fractions unlike denominators"))
print("Div:", ddg_search("khan academy dividing fractions"))
print("Alg:", ddg_search("khan academy solving basic equations"))
