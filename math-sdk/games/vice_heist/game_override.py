from game_executables import GameExecutables
from src.calculations.statistics import get_random_outcome


class GameStateOverride(GameExecutables):
    """Vice Heist — state-level overrides and special symbol behaviour."""

    def reset_book(self):
        super().reset_book()

    def assign_special_sym_function(self):
        """Wilds gain a multiplier attribute during free spins."""
        self.special_symbol_functions = {
            "W": [self.assign_wild_mult],
        }

    def assign_wild_mult(self, symbol) -> dict:
        multiplier_value = 1
        if self.gametype == self.config.freegame_type:
            multiplier_value = get_random_outcome(
                self.get_current_distribution_conditions()["mult_values"][self.gametype]
            )
        symbol.assign_attribute({"multiplier": multiplier_value})

    def check_repeat(self):
        super().check_repeat()
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True
                return
            if win_criteria is None and self.final_win == 0:
                self.repeat = True
                return
