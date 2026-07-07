"""
Vice Heist — Reel strip definitions.
Each reel is a list of symbol stops (40 stops per reel).
Designed to target ~96% RTP after simulation tuning.
"""
from symbols import (WILD, SCATTER, BOSS, FEMME, SAFE, GUN, MASK, ACE, KING, QUEEN, JACK)

# fmt: off
REEL_STRIPS = [
    # Reel 1  (40 stops)  WILD:2 SCATTER:2 BOSS:2 FEMME:3 SAFE:3 GUN:4 MASK:4 ACE:4 KING:4 QUEEN:5 JACK:7
    [
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, BOSS, WILD,
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, SCATTER, JACK,
        QUEEN, KING, ACE, MASK, GUN, BOSS, SAFE, FEMME, WILD, JACK,
        QUEEN, MASK, GUN, ACE, KING, SCATTER, JACK, QUEEN, JACK, JACK,
    ],
    # Reel 2  (40 stops)  WILD:1 SCATTER:2 BOSS:2 FEMME:3 SAFE:3 GUN:4 MASK:4 ACE:5 KING:5 QUEEN:4 JACK:7
    [
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, BOSS, JACK,
        QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, SCATTER, JACK, QUEEN,
        KING, ACE, MASK, GUN, BOSS, SAFE, WILD, FEMME, JACK, QUEEN,
        KING, ACE, MASK, GUN, SCATTER, JACK, QUEEN, KING, ACE, JACK,
    ],
    # Reel 3  (40 stops)  WILD:2 SCATTER:2 BOSS:2 FEMME:3 SAFE:3 GUN:4 MASK:4 ACE:4 KING:4 QUEEN:5 JACK:7
    [
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, BOSS, WILD,
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, SCATTER, JACK,
        QUEEN, KING, ACE, MASK, GUN, BOSS, SAFE, FEMME, WILD, JACK,
        QUEEN, MASK, GUN, ACE, KING, SCATTER, JACK, QUEEN, JACK, JACK,
    ],
    # Reel 4  (40 stops)  same distribution as reel 2
    [
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, BOSS, JACK,
        QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, SCATTER, JACK, QUEEN,
        KING, ACE, MASK, GUN, BOSS, SAFE, WILD, FEMME, JACK, QUEEN,
        KING, ACE, MASK, GUN, SCATTER, JACK, QUEEN, KING, ACE, JACK,
    ],
    # Reel 5  (40 stops)  same distribution as reel 1
    [
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, BOSS, WILD,
        JACK, QUEEN, KING, ACE, MASK, GUN, SAFE, FEMME, SCATTER, JACK,
        QUEEN, KING, ACE, MASK, GUN, BOSS, SAFE, FEMME, WILD, JACK,
        QUEEN, MASK, GUN, ACE, KING, SCATTER, JACK, QUEEN, JACK, JACK,
    ],
]
# fmt: on

def get_reel_counts():
    """Return frequency count of each symbol per reel."""
    from collections import Counter
    return [Counter(reel) for reel in REEL_STRIPS]
