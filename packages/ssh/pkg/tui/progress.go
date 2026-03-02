package tui

import (
	"fmt"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

// ── Form Progress Bar ──────────────────────────────────────────

const totalFormSteps = 9

// extractFormStep parses the current step number from the huh form's
// rendered view text (each field description contains "Step N of 9").
func extractFormStep(view string) int {
	for i := totalFormSteps; i >= 1; i-- {
		if strings.Contains(view, fmt.Sprintf("Step %d of %d", i, totalFormSteps)) {
			return i
		}
	}
	return 1
}

// renderFormProgress draws a segmented progress bar for the form.
func (m Model) renderFormProgress(current int) string {
	width := m.width
	if width == 0 {
		width = 80
	}

	barWidth := min(width-14, 54)
	segWidth := barWidth / totalFormSteps
	if segWidth < 2 {
		segWidth = 2
	}

	var segments []string
	for i := 1; i <= totalFormSteps; i++ {
		if i <= current {
			segments = append(segments, m.theme.TextHighlight().Render(strings.Repeat("━", segWidth)))
		} else {
			segments = append(segments, m.theme.TextMuted().Render(strings.Repeat("─", segWidth)))
		}
	}

	bar := strings.Join(segments, " ")
	label := m.theme.TextSky().Render(fmt.Sprintf(" %d/%d", current, totalFormSteps))
	return bar + label
}

// ── Spinner Animation ──────────────────────────────────────────

var spinnerFrames = []string{"⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"}

type spinnerTickMsg struct{}

func spinnerTick() tea.Cmd {
	return tea.Tick(80*time.Millisecond, func(time.Time) tea.Msg {
		return spinnerTickMsg{}
	})
}

// ── Submission Progress Steps ──────────────────────────────────

var submitSteps = []string{
	"Encrypting payload",
	"Connecting to Investec",
	"Transmitting request",
	"Awaiting confirmation",
}

type progressStepMsg struct{}

func progressStep() tea.Cmd {
	return tea.Tick(700*time.Millisecond, func(time.Time) tea.Msg {
		return progressStepMsg{}
	})
}

// ── Transition Delay ───────────────────────────────────────────

// Brief pause after API response to show the success/failure state
// before advancing to the final screen.
type transitionDoneMsg struct{}

func transitionDelay() tea.Cmd {
	return tea.Tick(1200*time.Millisecond, func(time.Time) tea.Msg {
		return transitionDoneMsg{}
	})
}

// ── Submission Progress Bar ────────────────────────────────────

func (m Model) renderSubmitProgress() string {
	width := m.width
	if width == 0 {
		width = 80
	}
	barW := min(width-10, 40)
	if barW < 10 {
		barW = 10
	}

	// Done state: full bar in success/error colour
	if m.submitDone {
		if m.submitSuccess {
			return m.theme.TextSuccess().Render(strings.Repeat("━", barW))
		}
		return m.theme.TextError().Render(strings.Repeat("━", barW))
	}

	// Progressive fill: each step fills proportionally, capping at ~85 %
	maxFill := (barW * 85) / 100
	step := m.submitProgress + 1
	filled := (maxFill * step) / len(submitSteps)
	empty := barW - filled

	return m.theme.TextHighlight().Render(strings.Repeat("━", filled)) +
		m.theme.TextMuted().Render(strings.Repeat("─", empty))
}
