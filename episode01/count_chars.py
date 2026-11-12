import re

text = open("voiceover.md").read().split("```")[1].strip()
clean = re.sub(r"\s*\[[^\]]*\]\s*", " ", text)
clean = "\n".join(re.sub(r"[ \t]+", " ", l).strip() for l in clean.splitlines())
print("with cues:", len(text))
print("clean:", len(clean))
print("words:", len(clean.split()))
open("voiceover_clean.txt", "w").write(clean + "\n")
