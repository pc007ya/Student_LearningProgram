#!/usr/bin/env python3
"""Build the two 500-word primary English banks and per-word SVG cards.

The source dictionary is ECDICT (MIT).  The generated JSON is checked into the
site so the learning game never needs a network connection at runtime.
"""
from __future__ import annotations

import csv
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/ecdict.csv")
OUT = ROOT / "data"
CARD_DIR = ROOT / "images" / "english-cards" / "words-v2"
EMOJI_KEYWORDS = ROOT / "data" / "emoji-keywords-en.json"

ESSENTIAL = """apple ant animal arm baby bag ball banana bear bed bee bird black blue boat body book box boy bread brother brown bus cake car cat chair chicken child circle class clock cloud coat color cow cup dad day desk dog doll door duck ear egg eight elephant eye face family farm father fish five flower food foot four fox friend frog fruit game garden girl goat good grape grass green hand happy hat head hello hen home horse house ice jacket juice jump key kite leg lemon lion little long mango map milk mom monkey moon morning mother mouse mouth name nest night nine nose number one orange owl panda park pear pen pencil pig pink pizza plane plant play purple queen rabbit rain red rice robot room ruler run school seven sheep shoe short sister six sky small snake sock spoon star sun table teacher ten tiger toy train tree two umbrella van water white window yellow zoo after again air answer ask away back beautiful because before big bike birthday blackboard brother buy call candy carry clean close cold come cook dance dark dinner draw drink easy eat English evening every family fast find first floor fly four funny get give glass go great hair help here hot hour how ice idea jacket jump keep kind know laugh learn left like line listen live look lunch make many morning music new next nice old open paper party people picture please read right river road sad say see sing sit sleep slow smile snow song speak spell stand stop story street study swim take talk tall thank thing think today together under up very walk want wash watch week well what where who why write year young""".split()

BLOCKED_FOR_CHILDREN = {"army", "blood", "danger", "dead", "death", "die", "disease", "drug", "fight", "hate", "kill", "military", "political", "politics", "sex", "war", "weapon"}

EMOJI = {
    "apple":"🍎","ant":"🐜","animal":"🐾","baby":"👶","bag":"🎒","ball":"⚽","banana":"🍌","bear":"🐻","bed":"🛏️","bee":"🐝","bird":"🐦","boat":"⛵","book":"📘","box":"📦","boy":"👦","bread":"🍞","bus":"🚌","cake":"🍰","car":"🚗","cat":"🐱","chair":"🪑","chicken":"🐔","clock":"🕐","cloud":"☁️","coat":"🧥","cow":"🐄","cup":"🥤","dog":"🐶","door":"🚪","duck":"🦆","ear":"👂","egg":"🥚","elephant":"🐘","eye":"👁️","fish":"🐟","flower":"🌼","fox":"🦊","frog":"🐸","grape":"🍇","hat":"🎩","horse":"🐴","house":"🏠","ice":"🧊","juice":"🧃","key":"🔑","kite":"🪁","lemon":"🍋","lion":"🦁","mango":"🥭","milk":"🥛","monkey":"🐒","moon":"🌙","mouse":"🐭","nest":"🪺","orange":"🍊","owl":"🦉","panda":"🐼","park":"🌳","pear":"🍐","pen":"🖊️","pencil":"✏️","pig":"🐷","pizza":"🍕","plane":"✈️","plant":"🌱","queen":"👑","rabbit":"🐰","rain":"🌧️","rice":"🍚","robot":"🤖","ruler":"📏","school":"🏫","sheep":"🐑","shoe":"👟","snake":"🐍","sock":"🧦","spoon":"🥄","star":"⭐","sun":"☀️","table":"🪑","teacher":"🧑‍🏫","tiger":"🐯","toy":"🧸","train":"🚆","tree":"🌳","umbrella":"☂️","van":"🚐","water":"💧","window":"🪟","zoo":"🦒",
    "city":"🏙️","office":"🏢","health":"🏥","art":"🎨","heart":"❤️","light":"💡","voice":"🗣️","police":"👮","town":"🏘️","building":"🏢","player":"🏃","season":"🍂","money":"💰","power":"⚡","job":"💼","business":"🏪","service":"🛎️","team":"👥","minute":"⏱️","parent":"👪","history":"🏛️","research":"🔬","education":"🎓","market":"🛒","nation":"🌐","college":"🏫","price":"🏷️","model":"🧩","tax":"🧾","director":"🎬","wife":"👩","son":"👦","drug":"💊","leader":"🧑‍💼","field":"🌾","report":"📄","letter":"✉️","phone":"📱","camera":"📷","computer":"💻","hospital":"🏥","doctor":"🧑‍⚕️","nurse":"👩‍⚕️","fire":"🔥","gift":"🎁","beach":"🏖️","mountain":"⛰️","forest":"🌲","bridge":"🌉","island":"🏝️","ship":"🚢","airport":"🛫","station":"🚉","bottle":"🍼","basket":"🧺","bowl":"🥣","plate":"🍽️","knife":"🔪","fork":"🍴","radio":"📻","television":"📺",
    "river":"🏞️","lake":"🏞️","pond":"🏞️","nest":"🪺","ruler":"📏","sock":"🧦","socks":"🧦","van":"🚐","zoo":"🦒","street":"🛣️","blackboard":"🟩","color":"🎨","picture":"🖼️","story":"📖","wash":"🧼","week":"🗓️","brother":"👦","sister":"👧","class":"🧑‍🏫","short":"📏","tall":"📏"
}

def emoji_keyword_index() -> dict[str, str]:
    """Return an exact English keyword -> emoji lookup from emojilib.

    Exact matching is intentional: fuzzy matches can turn a primary-school
    card into the wrong picture. Curated EMOJI entries above always win.
    """
    if not EMOJI_KEYWORDS.exists():
        return {}
    source = json.loads(EMOJI_KEYWORDS.read_text(encoding="utf-8"))
    result: dict[str, str] = {}
    for emoji, keywords in source.items():
        for keyword in keywords:
            normalized = keyword.lower().replace("_", " ").strip()
            result.setdefault(normalized, emoji)
    return result

S2T = str.maketrans({"这":"這","个":"個","为":"為","与":"與","门":"門","车":"車","马":"馬","鸟":"鳥","鱼":"魚","书":"書","云":"雲","开":"開","关":"關","说":"說","话":"話","见":"見","学":"學","习":"習","后":"後","里":"裡","东":"東","乐":"樂","来":"來","长":"長","发":"發","头":"頭","听":"聽","写":"寫","画":"畫","国":"國","数":"數","岁":"歲","万":"萬","时":"時","点":"點","钟":"鐘","买":"買","卖":"賣","让":"讓","们":"們","从":"從","还":"還","会":"會","动":"動","颜":"顏","鸡":"雞","鸭":"鴨","猫":"貓","叶":"葉","风":"風","电":"電","灯":"燈","边":"邊","记":"記","爱":"愛","带":"帶","给":"給","过":"過","进":"進","远":"遠","近":"近","两":"兩","对":"對","经":"經","间":"間","内":"內","现":"現","样":"樣","处":"處","种":"種","实":"實","简":"簡","单":"單","总":"總","并":"並","读":"讀"})

def meaning(raw: str) -> str:
    raw = re.sub(r"\[[^\]]+\]", "", raw or "").split("\\n", 1)[0]
    raw = re.sub(r"^(art|n|v|vt|vi|a|adj|adv|pron|prep|conj|num|interj)\.\s*", "", raw, flags=re.I)
    raw = re.split(r"[,，;；]", raw)[0].strip().translate(S2T)
    return raw or "常用英文單字"

def category(word: str) -> str:
    groups = {
        "動物": "ant animal bear bee bird cat chicken cow dog duck elephant fish fox frog goat hen horse lion monkey mouse owl panda pig rabbit sheep snake tiger",
        "食物": "apple banana bread cake candy egg food fruit grape juice lemon mango milk orange pear pizza rice water",
        "學校": "answer book class desk draw english learn listen map music number paper pen pencil picture read ruler school speak spell story study teacher write",
        "交通": "bike boat bus car plane road street train van",
        "自然": "air cloud farm flower garden ice moon park plant rain river sky snow star sun tree",
        "人物": "baby boy brother child dad family father friend girl mom mother queen sister",
        "用品": "bag ball bed box chair clock coat cup door glass hat house jacket key kite robot shoe sock spoon table toy umbrella window",
    }
    for name, words in groups.items():
        if word in words.split(): return name
    return "生活"

def card_svg(entry: dict) -> str:
    hue = (sum(map(ord, entry["word"])) * 37) % 360
    icon = html.escape(entry["emoji"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="360" height="300" viewBox="0 0 360 300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl({hue} 90% 94%)"/><stop offset="1" stop-color="hsl({(hue+42)%360} 85% 82%)"/></linearGradient></defs>
<rect width="360" height="300" rx="34" fill="url(#g)"/><circle cx="52" cy="48" r="18" fill="#fff" opacity=".65"/><circle cx="314" cy="55" r="12" fill="#fff" opacity=".55"/><path d="M28 259 Q180 219 332 259" fill="none" stroke="#fff" stroke-width="12" opacity=".45"/>
<text x="180" y="202" text-anchor="middle" font-size="142">{icon}</text></svg>'''

def main() -> None:
    if not SOURCE.exists(): raise SystemExit(f"missing source: {SOURCE}")
    rows = {}
    with SOURCE.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            word = row["word"].strip().lower()
            if word.isalpha() and 2 <= len(word) <= 10:
                rows[word] = row
    selected = []
    for word in ESSENTIAL:
        if word in rows and word not in selected: selected.append(word)
    def rank(value: str) -> int:
        try:
            parsed = int(value)
            return parsed if parsed > 0 else 9_999_999
        except (TypeError, ValueError):
            return 9_999_999

    # ECDICT's `zk` tag is the school vocabulary group.  Keeping the automatic
    # fill inside that group avoids adult/current-affairs vocabulary while the
    # curated list above keeps the earliest concrete words at the front.
    pool = sorted(
        (row for row in rows.values() if row["word"].lower().isalpha() and "zk" in row["tag"].split() and row["word"].lower() not in BLOCKED_FOR_CHILDREN),
        key=lambda row: (len(row["word"]), rank(row["frq"]), rank(row["bnc"])),
    )
    for row in pool:
        word = row["word"].lower()
        if word not in selected: selected.append(word)
        if len(selected) >= 1000: break
    OUT.mkdir(exist_ok=True); CARD_DIR.mkdir(parents=True, exist_ok=True)
    banks = {1: [], 2: []}
    keyword_emoji = emoji_keyword_index()
    for index, word in enumerate(selected[:1000]):
        grade = 1 if index < 500 else 2
        row = rows[word]
        entry = {"id": f"en-g{grade}-{index % 500 + 1:03d}", "grade": grade, "word": word, "meaning": meaning(row["translation"]), "phonetic": row["phonetic"], "category": category(word), "emoji": EMOJI.get(word, keyword_emoji.get(word, "🔤")), "image": f"images/english-cards/words-v2/{word}.svg"}
        banks[grade].append(entry)
        (CARD_DIR / f"{word}.svg").write_text(card_svg(entry), encoding="utf-8")
    for grade, bank in banks.items():
        (OUT / f"english-words-grade{grade}-v2.json").write_text(json.dumps({"schemaVersion":2,"grade":grade,"count":len(bank),"words":bank}, ensure_ascii=False, indent=2), encoding="utf-8")
    print({grade: len(bank) for grade, bank in banks.items()})

if __name__ == "__main__": main()
