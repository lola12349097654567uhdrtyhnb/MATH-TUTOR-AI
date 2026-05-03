import urllib.request
import re

def search_yt(query):
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        video_ids = re.findall(r"watch\?v=(\S{11})", html)
        # Try to find one that allows embeds
        for vid in video_ids:
            # check embed
            try:
                emb = urllib.request.urlopen("https://www.youtube.com/embed/" + vid).read().decode('utf-8')
                if "UNAVAILABLE" not in emb.upper():
                    return vid
            except:
                pass
        return video_ids[0] if video_ids else None
    except Exception as e:
        return None

queries = {
    "fraction_addition": "khan academy adding fractions with unlike denominators",
    "fraction_multiplication": "khan academy multiplying fractions",
    "fraction_division": "khan academy dividing fractions",
    "algebra_transposing": "khan academy solving basic equations",
    "algebra_substitution": "khan academy evaluating expressions with two variables"
}

for k, q in queries.items():
    print(f"{k}: {search_yt(q)}")
