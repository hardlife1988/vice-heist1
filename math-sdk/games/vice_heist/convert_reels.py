"""
One-time script: convert Vice Heist CSVs from (rows=reels, cols=stops)
to SDK format (rows=stops, cols=reels) and rename symbols.
Run from the math-sdk/games/vice_heist/ directory.
"""
import os

SYM_MAP = {
    "wild":        "W",
    "scatter":     "SC",
    "bonus_vault": "BV",
    "diamond":     "H1",
    "gold_bar":    "H2",
    "cash_stack":  "H3",
    "heist_bag":   "H4",
    "vault":       "H5",
    "A":           "A",
    "K":           "K",
    "Q":           "Q",
    "J":           "J",
}

HERE = os.path.dirname(__file__)

def convert_csv(src_path, dst_path):
    with open(src_path) as f:
        rows = [line.strip().split(",") for line in f if line.strip()]

    # rows[i] = all stops for reel i   →   cols[j][i] = stop j of reel i
    reels = [[SYM_MAP.get(s.strip(), s.strip()) for s in row] for row in rows]
    max_len = max(len(r) for r in reels)

    # Pad shorter reels with J (low-value symbol)
    for r in reels:
        while len(r) < max_len:
            r.append("J")

    # Transpose: row = stop index, col = reel index
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with open(dst_path, "w") as f:
        for stop in range(max_len):
            f.write(",".join(reel[stop] for reel in reels) + "\n")
    print(f"  ✅ {os.path.basename(dst_path)}  ({max_len} stops × {len(reels)} reels)")


if __name__ == "__main__":
    src_dir = os.path.join(HERE, "../../..", "math", "reels")
    dst_dir = os.path.join(HERE, "reels")
    for name in ("BR0.csv", "FR0.csv"):
        convert_csv(os.path.join(src_dir, name), os.path.join(dst_dir, name))

    # Also write a win-cap free reel (FR0 with 3× more wilds on every reel)
    # For now just copy FR0 as FRWCAP
    import shutil
    shutil.copy(os.path.join(dst_dir, "FR0.csv"), os.path.join(dst_dir, "FRWCAP.csv"))
    print("  ✅ FRWCAP.csv (copy of FR0)")
