# 英文單字資料來源

`english-words-grade1-v2.json` 與 `english-words-grade2-v2.json` 各含 500 個不重複單字。

- 單字、音標與中文釋義的來源資料：ECDICT（MIT License）
- 專案內再依低年級常用字優先順序、字長與使用頻率分級
- 其中 120 個具體名詞使用獨立生成專圖（小一、小二各 60 題），供拼字、看圖四選一、正面卡六對六配對與句子缺字挑戰共用
- 專圖清單、格式與生成限制：`english-generated-art-manifest.md`
- 套用及驗證：`python3 tools/apply_english_generated_art.py && python3 tools/validate_learning_content.py`
- 可重建指令：`python3 tools/build_english_vocab.py /path/to/ecdict.csv`

ECDICT: https://github.com/skywind3000/ECDICT
