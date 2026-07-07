"""
Vice Heist — Symbol definitions and paytable.
Pays are in credits per 1-credit bet per payline.
Scatter pays are multipliers of TOTAL BET.
"""

# Symbol IDs
WILD    = "WILD"
SCATTER = "SCATTER"
BOSS    = "BOSS"       # top premium
FEMME   = "FEMME"      # premium
SAFE    = "SAFE"       # premium
GUN     = "GUN"        # mid
MASK    = "MASK"       # mid
ACE     = "ACE"        # low
KING    = "KING"       # low
QUEEN   = "QUEEN"      # low
JACK    = "JACK"       # low

ALL_SYMBOLS = [WILD, SCATTER, BOSS, FEMME, SAFE, GUN, MASK, ACE, KING, QUEEN, JACK]

# Payline pays: {symbol: {match_count: credits_per_line}}
# WILD pays on its own; also substitutes for all except SCATTER
PAYLINE_PAYS = {
    WILD:   {5: 500, 4: 100, 3: 25},
    BOSS:   {5: 200, 4: 50,  3: 10},
    FEMME:  {5: 150, 4: 40,  3: 8},
    SAFE:   {5: 100, 4: 30,  3: 6},
    GUN:    {5: 75,  4: 20,  3: 5},
    MASK:   {5: 50,  4: 15,  3: 4},
    ACE:    {5: 30,  4: 10,  3: 3},
    KING:   {5: 25,  4: 8,   3: 2},
    QUEEN:  {5: 20,  4: 6,   3: 2},
    JACK:   {5: 15,  4: 5,   3: 1},
}

# Scatter pays: multiplier × total_bet (any position, not on paylines)
SCATTER_PAYS = {
    5: 20,
    4: 5,
    3: 2,
}

# Scatter free-spin awards
FREE_SPIN_AWARDS = {
    3: 10,
    4: 15,
    5: 20,
}

# Free-spin multiplier
FREE_SPIN_MULTIPLIER = 2
