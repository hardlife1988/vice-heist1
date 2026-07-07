"""
Vice Heist — 20 payline patterns for a 5-reel x 3-row grid.
Each payline is a list of row indices [reel0_row, reel1_row, reel2_row, reel3_row, reel4_row]
Rows: 0=top, 1=middle, 2=bottom
"""

PAYLINES = [
    [1, 1, 1, 1, 1],  # 01 — middle straight
    [0, 0, 0, 0, 0],  # 02 — top straight
    [2, 2, 2, 2, 2],  # 03 — bottom straight
    [0, 1, 2, 1, 0],  # 04 — V-shape
    [2, 1, 0, 1, 2],  # 05 — inverted V
    [0, 0, 1, 2, 2],  # 06 — diagonal down-right
    [2, 2, 1, 0, 0],  # 07 — diagonal up-right
    [1, 0, 0, 0, 1],  # 08 — top dip
    [1, 2, 2, 2, 1],  # 09 — bottom dip
    [0, 1, 0, 1, 0],  # 10 — zigzag top
    [2, 1, 2, 1, 2],  # 11 — zigzag bottom
    [1, 0, 1, 0, 1],  # 12 — zigzag top-mid
    [1, 2, 1, 2, 1],  # 13 — zigzag bottom-mid
    [0, 0, 1, 0, 0],  # 14 — top with mid dip
    [2, 2, 1, 2, 2],  # 15 — bottom with mid peak
    [1, 1, 0, 1, 1],  # 16 — mid with top peak
    [1, 1, 2, 1, 1],  # 17 — mid with bottom dip
    [0, 1, 1, 1, 0],  # 18 — arch
    [2, 1, 1, 1, 2],  # 19 — valley
    [0, 2, 0, 2, 0],  # 20 — wide zigzag
]

NUM_PAYLINES = len(PAYLINES)
