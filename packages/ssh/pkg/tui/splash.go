package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// ── Version ────────────────────────────────────────────────────

const Version = "0.1.7"

// ── Investec ASCII Art ─────────────────────────────────────────

const asciiTitle = `
 ██╗███╗   ██╗██╗   ██╗███████╗███████╗████████╗███████╗ ██████╗
 ██║████╗  ██║██║   ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔════╝
 ██║██╔██╗ ██║██║   ██║█████╗  ███████╗   ██║   █████╗  ██║
 ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ╚════██║   ██║   ██╔══╝  ██║
 ██║██║ ╚████║ ╚████╔╝ ███████╗███████║   ██║   ███████╗╚██████╗
 ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚══════╝   ╚═╝   ╚══════╝ ╚═════╝
 ███████╗██╗    ██╗ █████╗  ██████╗
 ██╔════╝██║    ██║██╔══██╗██╔════╝
 ███████╗██║ █╗ ██║███████║██║  ███╗
 ╚════██║██║███╗██║██╔══██║██║   ██║
 ███████║╚███╔███╔╝██║  ██║╚██████╔╝
 ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝`

func (m Model) splashView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	// ── ASCII banner — single dominant colour (Navy 300) ───────
	banner := m.theme.TextBrand().Render(asciiTitle)

	// ── Divider (Navy 700) ─────────────────────────────────────
	divW := min(width-4, 66)
	divider := m.theme.TextMuted().Render(strings.Repeat("─", divW))

	// ── Body — left-aligned, developer tone ────────────────────
	title := m.theme.TextAccent().Bold(true).Render("Developer Swag Provisioning Terminal")

	desc := lipgloss.JoinVertical(lipgloss.Left,
		m.theme.TextBody().Render("Initiate a request for Investec developer swag."),
		m.theme.TextBody().Render("Allocate your details, pick your size, submit."),
		m.theme.TextBody().Render("Go out and touch grass."),
	)

	// ── System status block ────────────────────────────────────
	label := m.theme.TextMuted()
	val := m.theme.TextSky()

	authStr := "none"
	if len(m.fingerprint) > 0 {
		fp := m.fingerprint
		if len(fp) > 20 {
			fp = fp[:20] + "…"
		}
		authStr = fp
	}

	statusContent := lipgloss.JoinVertical(lipgloss.Left,
		fmt.Sprintf("  %s  %s", label.Render("node  "), val.Render("swag-ssh v"+Version)),
		fmt.Sprintf("  %s  %s", label.Render("status"), val.Render("online")),
		fmt.Sprintf("  %s  %s", label.Render("auth  "), val.Render(authStr)),
	)

	statusBox := m.renderer.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(m.theme.Border()).
		Padding(0, 1).
		Render(statusContent)

	// ── Action cues ────────────────────────────────────────────
	enterKey := m.theme.TextHighlight().Bold(true).Render("ENTER")
	enterLabel := m.theme.TextAccent().Render("  initiate request")
	quitKey := m.theme.TextMuted().Render("q")
	quitLabel := m.theme.TextBody().Render("      disconnect")

	actions := lipgloss.JoinVertical(lipgloss.Left,
		enterKey+enterLabel,
		quitKey+quitLabel,
	)

	// ── Compose left-aligned body block ────────────────────────
	body := lipgloss.JoinVertical(lipgloss.Left,
		"",
		title,
		"",
		desc,
		"",
		statusBox,
		"",
		actions,
		"",
	)

	bodyPadded := m.renderer.NewStyle().PaddingLeft(2).Render(body)

	// ── Full layout: centred banner, then left-aligned body ────
	content := lipgloss.JoinVertical(lipgloss.Left,
		"",
		banner,
		divider,
		bodyPadded,
	)

	// Outer wrapper — centre the whole block in the terminal
	outer := m.renderer.NewStyle().Width(width).Align(lipgloss.Center)
	return outer.Render(content)
}
