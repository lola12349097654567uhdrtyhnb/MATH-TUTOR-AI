import urllib.request
import re
import json

def get_khan(topic):
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=khan+academy+{urllib.parse.quote(topic)}&utf8=&format=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req).read().decode('utf-8')
        return json.loads(res)['query']['search'][0]['title']
    except:
        return "Failed"
print(get_khan("fractions"))
