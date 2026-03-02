package tui

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// reviewOption represents the user's selection on the review screen.
type reviewOption int

const (
	reviewSubmit reviewOption = iota
	reviewEdit
	reviewCancel
)

func (m Model) reviewView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	// Header
	header := m.theme.TextAccent().Bold(true).Render("Review Your Request")
	headerLine := m.theme.TextMuted().Render("─────────────────────────────────────")

	// Data display
	label := m.theme.TextBody()
	value := m.theme.TextAccent()

	info := lipgloss.JoinVertical(lipgloss.Left,
		fmt.Sprintf("%s  %s", label.Render("Name:    "), value.Render(m.formData.FullName)),
		fmt.Sprintf("%s  %s", label.Render("Email:   "), value.Render(m.formData.Email)),
		fmt.Sprintf("%s  %s", label.Render("Phone:   "), value.Render(m.formData.Phone)),
		fmt.Sprintf("%s  %s", label.Render("Size:    "), value.Render(m.formData.ShirtSize)),
		"",
		label.Render("Why you deserve swag:"),
		value.Render(m.formData.Note),
		"",
		m.theme.TextAccent().Bold(true).Render("Delivery Address"),
		fmt.Sprintf("%s  %s", label.Render("Address: "), value.Render(m.formData.StreetAddress)),
	)
	if m.formData.Company != "" {
		info = lipgloss.JoinVertical(lipgloss.Left,
			info,
			fmt.Sprintf("%s  %s", label.Render("Company: "), value.Render(m.formData.Company)),
		)
	}
	info = lipgloss.JoinVertical(lipgloss.Left,
		info,
		fmt.Sprintf("%s  %s", label.Render("City:    "), value.Render(m.formData.City)),
		fmt.Sprintf("%s  %s", label.Render("Province:"), value.Render(m.formData.Province)),
		fmt.Sprintf("%s  %s", label.Render("Postcode:"), value.Render(m.formData.Postcode)),
	)

	// Wrap info in a box
	infoBox := m.theme.Box(false).Width(min(width-8, 56)).Render(info)

	// Action options
	options := []string{"Submit Request", "Edit Details", "Cancel"}
	var optionLines string
	for i, opt := range options {
		if i == int(m.reviewSelection) {
			optionLines += m.theme.TextHighlight().Bold(true).Render(fmt.Sprintf("  > %s", opt)) + "\n"
		} else {
			optionLines += m.theme.TextBody().Render(fmt.Sprintf("    %s", opt)) + "\n"
		}
	}

	content := lipgloss.JoinVertical(lipgloss.Left,
		"",
		header,
		headerLine,
		"",
		infoBox,
		"",
		optionLines,
	)

	center := lipgloss.NewStyle().Width(width).Align(lipgloss.Center)
	return center.Render(content)
}

// reviewUpdate handles keypresses on the review screen.
func (m Model) reviewUpdate(msg tea.Msg) (Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			if m.reviewSelection > 0 {
				m.reviewSelection--
			}
		case "down", "j":
			if m.reviewSelection < reviewCancel {
				m.reviewSelection++
			}
		case "enter":
			switch m.reviewSelection {
			case reviewSubmit:
				m.page = submittingPage
				m.spinnerFrame = 0
				m.submitProgress = 0
				m.submitDone = false
				m.submitSuccess = false
				return m, tea.Batch(m.submitRequest(), spinnerTick(), progressStep())
			case reviewEdit:
				m.page = formPage
				m.initForm()
			case reviewCancel:
				m.page = splashPage
			}
		case "esc":
			m.page = formPage
			m.initForm()
		}
	}
	return m, nil
}
