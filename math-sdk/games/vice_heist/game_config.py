"""Vice Heist — GameConfig for Stake Engine SDK.

5-reel x 3-row, 20-payline slot. Heist theme.
Symbols: W (Wild), SC (Scatter), BV (Bonus Vault), H1-H5, A, K, Q, J
"""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


class GameConfig(Config):

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id       = "vice_heist"
        self.provider_number = 0
        self.working_name  = "Vice Heist"
        self.wincap        = 10000.0
        self.win_type      = "lines"
        self.rtp           = 0.96
        self.construct_paths()

        # Board dimensions
        self.num_reels = 5
        self.num_rows  = [3] * self.num_reels

        # ── Paytable ────────────────────────────────────────────────────
        # Pays are x-bet multipliers (total_bet × value)
        self.paytable = {
            # Wild
            (5, "W"):  79.5,
            (4, "W"):  4.28,
            (3, "W"):  0.64,
            # H1 Diamond — top premium
            (5, "H1"): 16.0,
            (4, "H1"): 1.60,
            (3, "H1"): 0.265,
            # H2 Gold Bar
            (5, "H2"): 7.43,
            (4, "H2"): 0.795,
            (3, "H2"): 0.127,
            # H3 Cash Stack
            (5, "H3"): 4.79,
            (4, "H3"): 0.58,
            (3, "H3"): 0.107,
            # H4 Heist Bag
            (5, "H4"): 3.19,
            (4, "H4"): 0.428,
            (3, "H4"): 0.086,
            # H5 Vault
            (5, "H5"): 2.13,
            (4, "H5"): 0.295,
            (3, "H5"): 0.064,
            # Low cards
            (5, "A"):  1.06,
            (4, "A"):  0.149,
            (3, "A"):  0.043,
            (5, "K"):  0.638,
            (4, "K"):  0.106,
            (3, "K"):  0.027,
            (5, "Q"):  0.638,
            (4, "Q"):  0.106,
            (3, "Q"):  0.027,
            (5, "J"):  0.50,
            (4, "J"):  0.085,
            (3, "J"):  0.021,
        }

        # ── Paylines (20) ───────────────────────────────────────────────
        self.paylines = {
            1:  [1, 1, 1, 1, 1],
            2:  [0, 0, 0, 0, 0],
            3:  [2, 2, 2, 2, 2],
            4:  [0, 1, 2, 1, 0],
            5:  [2, 1, 0, 1, 2],
            6:  [0, 0, 1, 0, 0],
            7:  [2, 2, 1, 2, 2],
            8:  [0, 1, 1, 1, 0],
            9:  [2, 1, 1, 1, 2],
            10: [1, 0, 1, 0, 1],
            11: [1, 2, 1, 2, 1],
            12: [0, 1, 0, 1, 0],
            13: [2, 1, 2, 1, 2],
            14: [0, 0, 1, 2, 2],
            15: [2, 2, 1, 0, 0],
            16: [0, 1, 2, 2, 2],
            17: [2, 1, 0, 0, 0],
            18: [1, 1, 0, 1, 1],
            19: [1, 1, 2, 1, 1],
            20: [0, 2, 0, 2, 0],
        }

        # ── Special symbols ─────────────────────────────────────────────
        self.special_symbols = {
            "wild":    ["W"],
            "scatter": ["SC"],
            "bonus":   ["BV"],
        }
        self.include_padding = True

        # ── Free-spin triggers (scatter count → free spins) ─────────────
        # Cover all possible scatter counts (max 15 on a 5×3 grid).
        # Basegame: 3+ scatters award free spins
        # Freegame retrigger: 2+ scatters award extra spins
        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 15, 5: 20, 6: 20, 7: 20, 8: 20,
                                 9: 20, 10: 20, 11: 20, 12: 20, 13: 20, 14: 20, 15: 20},
            self.freegame_type: {2: 3,  3: 5,  4: 8,  5: 12, 6: 12, 7: 12,
                                 8: 12, 9: 12, 10: 12, 11: 12, 12: 12, 13: 12, 14: 12, 15: 12},
        }
        self.anticipation_triggers = {
            self.basegame_type: 2,
            self.freegame_type: 2,
        }

        # ── Reels ────────────────────────────────────────────────────────
        reel_files = {"BR0": "BR0.csv", "FR0": "FR0.csv", "FRWCAP": "FRWCAP.csv"}
        self.reels = {}
        for key, fname in reel_files.items():
            self.reels[key] = self.read_reels_csv(os.path.join(self.reels_path, fname))

        self.padding_reels[self.basegame_type] = self.reels["BR0"]
        self.padding_reels[self.freegame_type] = self.reels["FR0"]

        # ── Bet-mode conditions ──────────────────────────────────────────
        freegame_cond = {
            "reel_weights": {
                self.basegame_type: {"BR0": 1},
                self.freegame_type: {"FR0": 1},
            },
            "scatter_triggers": {3: 50, 4: 20, 5: 5},
            "mult_values": {
                self.basegame_type: {1: 1},
                self.freegame_type: {2: 60, 3: 80, 4: 50, 5: 20, 10: 15, 20: 10, 50: 5},
            },
            "force_wincap": False,
            "force_freegame": True,
        }

        basegame_cond = {
            "reel_weights": {self.basegame_type: {"BR0": 1}},
            "mult_values": {self.basegame_type: {1: 1}},
            "force_wincap": False,
            "force_freegame": False,
        }

        wincap_cond = {
            "reel_weights": {
                self.basegame_type: {"BR0": 1},
                self.freegame_type: {"FR0": 1, "FRWCAP": 5},
            },
            "mult_values": {
                self.basegame_type: {1: 1},
                self.freegame_type: {2: 10, 3: 20, 4: 50, 5: 60, 10: 100, 20: 90, 50: 50},
            },
            "scatter_triggers": {4: 1, 5: 2},
            "force_wincap": True,
            "force_freegame": True,
        }

        zerowin_cond = {
            "reel_weights": {self.basegame_type: {"BR0": 1}},
            "mult_values": {self.basegame_type: {1: 1}},
            "force_wincap": False,
            "force_freegame": False,
        }

        mode_maxwins = {"base": self.wincap, "bonus": self.wincap}

        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=mode_maxwins["base"],
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["base"],
                        conditions=wincap_cond,
                    ),
                    Distribution(criteria="freegame", quota=0.10, conditions=freegame_cond),
                    Distribution(criteria="0",        quota=0.40, win_criteria=0.0, conditions=zerowin_cond),
                    Distribution(criteria="basegame", quota=0.499, conditions=basegame_cond),
                ],
            ),
            BetMode(
                name="bonus",
                cost=100.0,
                rtp=self.rtp,
                max_win=mode_maxwins["bonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["bonus"],
                        conditions=wincap_cond,
                    ),
                    Distribution(criteria="freegame", quota=0.999, conditions=freegame_cond),
                ],
            ),
        ]
