class GameConfig:
    def __init__(self):
        self.name = "Vice Heist"
        self.rtp = 0.96  # 96% return to player
        self.reels = 5
        self.rows = 3
        self.paylines = 20
        self.min_bet = 0.20
        self.max_bet = 100.0
        self.default_bet = 1.0

    def to_dict(self):
        return {
            "name": self.name,
            "rtp": self.rtp,
            "reels": self.reels,
            "rows": self.rows,
            "paylines": self.paylines,
            "min_bet": self.min_bet,
            "max_bet": self.max_bet,
            "default_bet": self.default_bet,
        }
