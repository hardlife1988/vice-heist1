class GameState:
    def __init__(self, config):
        self.config = config
        self.balance = 1000.0
        self.total_bet = 0.0
        self.total_win = 0.0
        self.spin_count = 0

    def spin(self, bet=None):
        if bet is None:
            bet = self.config.default_bet
        self.balance -= bet
        self.total_bet += bet
        self.spin_count += 1
        return {"bet": bet, "win": 0.0, "spin": self.spin_count}

    def to_dict(self):
        return {
            "balance": self.balance,
            "total_bet": self.total_bet,
            "total_win": self.total_win,
            "spin_count": self.spin_count,
        }
