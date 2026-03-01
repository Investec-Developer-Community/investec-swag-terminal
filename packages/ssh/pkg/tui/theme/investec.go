package theme

import (
	"github.com/charmbracelet/lipgloss"
)

// Investec brand terminal theme.
//
// Colour discipline (95/5 rule):
//   - 95 % core palette: White, Navy, Stone, Sky
//   - 5 % accent palette: Teal (preferred), Amber, Burgundy
//
// Accent colours are reserved for interaction cues only (cursor,
// ENTER highlight, progress/success state).
type Theme struct {
	renderer *lipgloss.Renderer

	background lipgloss.TerminalColor // Navy 900 — canvas
	border     lipgloss.TerminalColor // Navy 700 — dividers, box borders
	body       lipgloss.TerminalColor // Stone — secondary text, labels
	accent     lipgloss.TerminalColor // White — primary text
	brand      lipgloss.TerminalColor // Navy 300 — ASCII art, headings
	highlight  lipgloss.TerminalColor // Teal — interaction cues (5 %)
	success    lipgloss.TerminalColor // Teal — progress / success state
	errorColor lipgloss.TerminalColor // Burgundy — error state
	sky        lipgloss.TerminalColor // Sky 300 — meta / info text
	muted      lipgloss.TerminalColor // Navy 500 — dim / quiet text
}

// InvestecTheme returns the Investec-branded colour scheme.
func InvestecTheme(renderer *lipgloss.Renderer) Theme {
	return Theme{
		renderer:   renderer,
		background: lipgloss.Color("#0F2030"), // Navy 900
		border:     lipgloss.Color("#1E3A5F"), // Navy 700
		body:       lipgloss.Color("#B8AFA6"), // Stone
		accent:     lipgloss.Color("#FFFFFF"), // White
		brand:      lipgloss.Color("#6B9FC9"), // Navy 300
		highlight:  lipgloss.Color("#00A5B5"), // Teal
		success:    lipgloss.Color("#00A5B5"), // Teal
		errorColor: lipgloss.Color("#8B3A5E"), // Burgundy
		sky:        lipgloss.Color("#7DD3FC"), // Sky 300
		muted:      lipgloss.Color("#3D6B8E"), // Navy 500
	}
}

// ── Accessors ──────────────────────────────────────────────────

func (t Theme) Background() lipgloss.TerminalColor { return t.background }
func (t Theme) Border() lipgloss.TerminalColor     { return t.border }
func (t Theme) Body() lipgloss.TerminalColor       { return t.body }
func (t Theme) Accent() lipgloss.TerminalColor     { return t.accent }
func (t Theme) Brand() lipgloss.TerminalColor      { return t.brand }
func (t Theme) Highlight() lipgloss.TerminalColor  { return t.highlight }
func (t Theme) Success() lipgloss.TerminalColor    { return t.success }
func (t Theme) Error() lipgloss.TerminalColor      { return t.errorColor }
func (t Theme) Sky() lipgloss.TerminalColor        { return t.sky }
func (t Theme) Muted() lipgloss.TerminalColor      { return t.muted }

// ── Style Helpers ──────────────────────────────────────────────

func (t Theme) Base() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.body)
}

func (t Theme) TextAccent() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.accent)
}

func (t Theme) TextBrand() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.brand)
}

func (t Theme) TextHighlight() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.highlight)
}

func (t Theme) TextSuccess() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.success)
}

func (t Theme) TextError() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.errorColor)
}

func (t Theme) TextBody() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.body)
}

func (t Theme) TextSky() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.sky)
}

func (t Theme) TextMuted() lipgloss.Style {
	return t.renderer.NewStyle().Foreground(t.muted)
}

func (t Theme) Box(selected bool) lipgloss.Style {
	borderColor := t.border
	if selected {
		borderColor = t.highlight
	}
	return t.renderer.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(borderColor).
		Padding(1, 2)
}

func (t Theme) Button(active bool) lipgloss.Style {
	if active {
		return t.renderer.NewStyle().
			Background(t.highlight).
			Foreground(t.accent).
			Padding(0, 3).
			Bold(true)
	}
	return t.renderer.NewStyle().
		Background(t.border).
		Foreground(t.body).
		Padding(0, 3)
}
