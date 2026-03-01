package tui

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// confirmOption represents the user's selection on the confirm screen.
type confirmOption int

const (
	confirmAnother confirmOption = iota
	confirmExit
)

func (m Model) confirmView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	// Header — Teal for success state (brand-allowed accent)
	header := m.theme.TextSuccess().Bold(true).Render("Request Queued")
	headerLine := m.theme.TextMuted().Render("─────────────────────────────────────")

	// Message
	msg1 := m.theme.TextAccent().Render("We've received your swag request.")
	msg2 := m.theme.TextBody().Render("The Investec DevRel team will review it shortly.")
	msg3 := m.theme.TextBody().Render("You'll hear from us via email.")

	// Request ID
	idLine := m.theme.TextSky().Bold(true).Render(
		fmt.Sprintf("ref  #%s", m.requestID))

	// Options
	options := []string{"Submit another request", "Disconnect"}
	var optionLines string
	for i, opt := range options {
		if i == int(m.confirmSelection) {
			optionLines += m.theme.TextHighlight().Bold(true).Render(fmt.Sprintf("  > %s", opt)) + "\n"
		} else {
			optionLines += m.theme.TextBody().Render(fmt.Sprintf("    %s", opt)) + "\n"
		}
	}

	body := lipgloss.JoinVertical(lipgloss.Left,
		"",
		header,
		headerLine,
		"",
		msg1,
		msg2,
		msg3,
		"",
		idLine,
		"",
		optionLines,
		"",
	)

	padded := m.renderer.NewStyle().PaddingLeft(2).Render(body)
	outer := lipgloss.NewStyle().Width(width).Align(lipgloss.Center)
	return outer.Render(padded)
}

func (m Model) submittingView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	spinner := m.theme.TextHighlight().Render("⣾ ")
	msg := m.theme.TextAccent().Render("Submitting request…")

	content := lipgloss.JoinVertical(lipgloss.Center,
		"",
		"",
		"",
		spinner+msg,
		"",
	)

	center := lipgloss.NewStyle().Width(width).Align(lipgloss.Center)
	return center.Render(content)
}

func (m Model) errorView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	// Header — Burgundy for error state
	header := m.theme.TextError().Bold(true).Render("Submission Failed")
	headerLine := m.theme.TextMuted().Render("─────────────────────────────────────")

	msg := m.theme.TextBody().Render("We couldn't submit your request.")
	if m.submitError != nil {
		msg = m.theme.TextBody().Render(m.submitError.Error())
	}

	retry := m.theme.TextHighlight().Bold(true).Render("ENTER") +
		m.theme.TextAccent().Render("  retry")
	back := m.theme.TextMuted().Render("ESC") +
		m.theme.TextBody().Render("    go back")
	quit := m.theme.TextMuted().Render("q") +
		m.theme.TextBody().Render("      disconnect")

	body := lipgloss.JoinVertical(lipgloss.Left,
		"",
		header,
		headerLine,
		"",
		msg,
		"",
		retry,
		back,
		quit,
		"",
	)

	padded := m.renderer.NewStyle().PaddingLeft(2).Render(body)
	outer := lipgloss.NewStyle().Width(width).Align(lipgloss.Center)
	return outer.Render(padded)
}

// confirmUpdate handles keypresses on the confirmation screen.
func (m Model) confirmUpdate(msg tea.Msg) (Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			if m.confirmSelection > 0 {
				m.confirmSelection--
			}
		case "down", "j":
			if m.confirmSelection < confirmExit {
				m.confirmSelection++
			}
		case "enter":
			switch m.confirmSelection {
			case confirmAnother:
				// Reset form and go back
				m.formData = SwagFormData{}
				m.reviewSelection = 0
				m.confirmSelection = 0
				m.page = formPage
				m.initForm()
			case confirmExit:
				return m, tea.Quit
			}
		case "q":
			return m, tea.Quit
		}
	}
	return m, nil
}
