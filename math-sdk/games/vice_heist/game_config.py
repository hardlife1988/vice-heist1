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
        #
        # Values are rounded to the nearest 0.10x (minimum non-zero 0.10x) so
        # every payout lands on a multiple of 10 "cents" once scaled to the
        # RGS lookup-table's integer format -- required by Stake's RGS
        # verification (`verify_lookup_format`). The original 3-decimal
        # values were finer-grained than the format allows and only surfaced
        # once the free-spin hang above was fixed and format checks could
        # actually run.
        self.paytable = {
            # Wild
            (5, "W"):  79.5,
            (4, "W"):  4.3,
            (3, "W"):  0.6,
            # H1 Diamond — top premium
            (5, "H1"): 16.0,
            (4, "H1"): 1.6,
            (3, "H1"): 0.3,
            # H2 Gold Bar
            (5, "H2"): 7.4,
            (4, "H2"): 0.8,
            (3, "H2"): 0.1,
            # H3 Cash Stack
            (5, "H3"): 4.8,
            (4, "H3"): 0.6,
            (3, "H3"): 0.1,
            # H4 Heist Bag
            (5, "H4"): 3.2,
            (4, "H4"): 0.4,
            (3, "H4"): 0.1,
            # H5 Vault
            (5, "H5"): 2.1,
            (4, "H5"): 0.3,
            (3, "H5"): 0.1,
            # Low cards
            (5, "A"):  1.1,
            (4, "A"):  0.1,
            (3, "A"):  0.1,
            (5, "K"):  0.6,
            (4, "K"):  0.1,
            (3, "K"):  0.1,
            (5, "Q"):  0.6,
            (4, "Q"):  0.1,
            (3, "Q"):  0.1,
            (5, "J"):  0.5,
            (4, "J"):  0.1,
            (3, "J"):  0.1,
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
        # Cover all possible scatter counts (max 15 on a 5x3 grid).
        # Basegame: 3+ scatters award free spins
        # Freegame retrigger: 3+ scatters award extra spins
        #
        # NOTE: retrigger minimum was previously 2, paired with an ~12%
        # per-cell scatter density on FR0/FRWCAP -- that combination made the
        # expected retrigger spin-gain exceed the spin-cost, so free-spin
        # sessions never terminated (confirmed by direct simulation: a
        # session that should end after ~15-20 spins was still retriggering
        # after 3,000+ iterations). Raised the retrigger floor to 3 and cut
        # the FR0/FRWCAP scatter density from ~12% to ~4% (see reels/) so
        # retriggers stay rare bonus events instead of a runaway loop.
        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 15, 5: 20, 6: 20, 7: 20, 8: 20,
                                 9: 20, 10: 20, 11: 20, 12: 20, 13: 20, 14: 20, 15: 20},
            self.freegame_type: {3: 5,  4: 8,  5: 12, 6: 12, 7: 12,
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

        # Wincap quota calibration: the quota IS the live probability of
        # landing exactly on the forced max-win (`win_criteria`), and its
        # contribution to a mode's RTP is simply quota * wincap / cost --
        # fixed by that arithmetic, not something the optimizer can reweight
        # away. At the previous quota=0.001 (1-in-1000) with wincap=10000x,
        # that's a flat 1000% RTP contribution from the max win ALONE in
        # base mode (cost=1) -- confirmed directly from a real 60k-sim run,
        # not a sampling artifact: every one of the 60 forced wincap rows in
        # the published lookup table carried full weight, together
        # accounting for half of the entire base-mode payout sum. Rebalanced
        # both modes so the max win stays a rare, small slice of RTP (roughly
        # 2%) like a real jackpot event, instead of dominating it:
        #   base:  quota 0.001 -> 0.000002  (contributes ~0.0192, ~2% of 0.96 RTP)
        #   bonus: quota 0.001 -> 0.000192  (contributes ~0.0192, ~2% of 0.96 RTP; cost=100 already
        #                                    dampens this bucket 100x vs base, so it needed far less cutting)
        # The quota freed up from each mode's wincap bucket is folded back
        # into that mode's other distributions so quotas still sum to 1.0.
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
                        quota=0.000002,
                        win_criteria=mode_maxwins["base"],
                        conditions=wincap_cond,
                    ),
                    # Freegame trigger frequency, also recalibrated: the same
                    # freegame_cond is shared with bonus mode (where a real
                    # 60k-sim run showed it averaging ~100-110x per triggered
                    # session -- consistent with a bought feature costing
                    # 100x). At quota=0.10 (1-in-10 base spins), that session
                    # value alone contributed roughly 960-1000% RTP on its
                    # own. Dropped to 0.005 (1-in-200) so the feature still
                    # drives a meaningful, but no longer dominant, share of
                    # base-mode RTP; the freed-up quota moves to "0" below.
                    Distribution(criteria="freegame", quota=0.005, conditions=freegame_cond),
                    Distribution(criteria="0",        quota=0.495998, win_criteria=0.0, conditions=zerowin_cond),
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
                        quota=0.000192,
                        win_criteria=mode_maxwins["bonus"],
                        conditions=wincap_cond,
                    ),
                    Distribution(criteria="freegame", quota=0.999808, conditions=freegame_cond),
                ],
            ),
        ]
