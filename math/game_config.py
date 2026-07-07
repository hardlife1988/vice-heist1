"""
Vice Heist — Master game configuration.
"""
from symbols import PAYLINE_PAYS, SCATTER_PAYS, FREE_SPIN_AWARDS, FREE_SPIN_MULTIPLIER
from reels import REEL_STRIPS
from paylines import PAYLINES, NUM_PAYLINES


class GameConfig:
    def __init__(self):
        self.name = "Vice Heist"
        self.version = "1.0.0"
        self.rtp = 0.96          # target RTP
        self.reels = 5
        self.rows = 3
        self.num_paylines = NUM_PAYLINES
        self.min_bet = 0.20
        self.max_bet = 100.0
        self.default_bet = 1.0
        self.coin_value = 0.01   # 1 credit = $0.01

        # Math tables
        self.reel_strips = REEL_STRIPS
        self.paylines = PAYLINES
        self.payline_pays = PAYLINE_PAYS
        self.scatter_pays = SCATTER_PAYS
        self.free_spin_awards = FREE_SPIN_AWARDS
        self.free_spin_multiplier = FREE_SPIN_MULTIPLIER

    def to_dict(self):
        return {
            "name": self.name,
            "version": self.version,
            "rtp_target": self.rtp,
            "reels": self.reels,
            "rows": self.rows,
            "num_paylines": self.num_paylines,
            "min_bet": self.min_bet,
            "max_bet": self.max_bet,
            "default_bet": self.default_bet,
            "coin_value": self.coin_value,
            "reel_lengths": [len(r) for r in self.reel_strips],
            "paylines": self.paylines,
            "payline_pays": {k: v for k, v in self.payline_pays.items()},
            "scatter_pays": {str(k): v for k, v in self.scatter_pays.items()},
            "free_spin_awards": {str(k): v for k, v in self.free_spin_awards.items()},
            "free_spin_multiplier": self.free_spin_multiplier,
        }
