from game_calculations import GameCalculations
from src.calculations.lines import Lines


class GameExecutables(GameCalculations):
    """Vice Heist — evaluates payline wins using the SDK Lines engine."""

    def evaluate_lines_board(self):
        """Populate win data, record wins, and emit events."""
        self.win_data = Lines.get_lines(
            self.board,
            self.config,
            wild_key="wild",
            wild_sym="W",
            global_multiplier=self.global_multiplier,
        )
        Lines.record_lines_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        Lines.emit_linewin_events(self)
