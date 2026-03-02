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

	// Subtle easter egg hint
	hint := m.theme.TextMuted().Render("↑↑↓↓←→←→ ...you know the rest")

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
		hint,
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

	var icon, msg, detail string

	if m.submitDone {
		// Brief result flash before transition
		if m.submitSuccess {
			icon = m.theme.TextSuccess().Bold(true).Render("  ✓  ")
			msg = m.theme.TextAccent().Bold(true).Render("Request Submitted")
		} else {
			icon = m.theme.TextError().Bold(true).Render("  ✗  ")
			msg = m.theme.TextAccent().Bold(true).Render("Submission Failed")
		}
		detail = ""
	} else {
		// Animated spinner + progress steps
		frame := spinnerFrames[m.spinnerFrame%len(spinnerFrames)]
		icon = m.theme.TextHighlight().Render("  " + frame + "  ")
		step := submitSteps[m.submitProgress]
		msg = m.theme.TextAccent().Render(step)
		detail = m.theme.TextMuted().Render(
			fmt.Sprintf("  %d/%d", m.submitProgress+1, len(submitSteps)))
	}

	bar := m.renderSubmitProgress()

	content := lipgloss.JoinVertical(lipgloss.Center,
		"",
		"",
		"",
		icon+msg,
		"",
		bar+detail,
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
		key := msg.String()

		// Track Konami code input
		m.konamiBuf = append(m.konamiBuf, key)
		if len(m.konamiBuf) > 20 {
			m.konamiBuf = m.konamiBuf[len(m.konamiBuf)-20:]
		}
		if konamiCheck(m.konamiBuf) {
			m.konamiBuf = nil
			m.rickLyricIdx = 0
			m.page = rickrollPage
			return m, rickTick()
		}

		switch key {
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
				return m, m.form.Init()
			case confirmExit:
				return m, tea.Quit
			}
		case "q":
			return m, tea.Quit
		}
	}
	return m, nil
}
