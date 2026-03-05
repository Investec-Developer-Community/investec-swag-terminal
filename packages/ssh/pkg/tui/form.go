package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

// shirtSizes are the available options for the size selector.
var shirtSizes = []string{"XS", "S", "M", "L", "XL", "XXL"}

// saProvinces are the South African provinces for the province selector.
var saProvinces = []string{
	"Eastern Cape",
	"Free State",
	"Gauteng",
	"KwaZulu-Natal",
	"Limpopo",
	"Mpumalanga",
	"Northern Cape",
	"North West",
	"Western Cape",
}

var shirtSizeLabels = map[string]string{
	"XS":  "XS — Extra Small",
	"S":   "S  — Small",
	"M":   "M  — Medium",
	"L":   "L  — Large",
	"XL":  "XL — Extra Large",
	"XXL": "XXL — Double XL",
}

func shirtSizeOptions() []huh.Option[string] {
	options := make([]huh.Option[string], 0, len(shirtSizes))
	for _, size := range shirtSizes {
		options = append(options, huh.NewOption(shirtSizeLabels[size], size))
	}
	return options
}

func provinceOptions() []huh.Option[string] {
	options := make([]huh.Option[string], 0, len(saProvinces))
	for _, province := range saProvinces {
		options = append(options, huh.NewOption(province, province))
	}
	return options
}

// initForm creates the Huh form for swag request input.
func (m *Model) initForm() {
	m.form = huh.NewForm(
		huh.NewGroup(
			huh.NewInput().
				Key("fullName").
				Title("What's your full name?").
				Description("Step 1 of 9").
				Placeholder("e.g. Ada Lovelace").
				Validate(func(s string) error {
					if len(strings.TrimSpace(s)) < 2 {
						return fmt.Errorf("name must be at least 2 characters")
					}
					return nil
				}),
		),
		huh.NewGroup(
			huh.NewInput().
				Key("email").
				Title("What's your email address?").
				Description("Step 2 of 9").
				Placeholder("e.g. ada@example.com").
				Validate(func(s string) error {
					s = strings.TrimSpace(s)
					if !strings.Contains(s, "@") || !strings.Contains(s, ".") {
						return fmt.Errorf("please enter a valid email address")
					}
					return nil
				}),
		),
		huh.NewGroup(
			huh.NewInput().
				Key("phone").
				Title("What's your phone number?").
				Description("Step 3 of 9").
				Placeholder("e.g. +27821234567").
				Validate(func(s string) error {
					s = strings.TrimSpace(s)
					if len(s) < 7 {
						return fmt.Errorf("phone number seems too short")
					}
					return nil
				}),
		),
		huh.NewGroup(
			huh.NewSelect[string]().
				Key("shirtSize").
				Title("Pick your shirt size").
				Description("Step 4 of 9").
				Options(shirtSizeOptions()...),
		),
		huh.NewGroup(
			huh.NewText().
				Key("note").
				Title("Tell us why you deserve some swag!").
				Description("Step 5 of 9 — Be creative!").
				Placeholder("e.g. I built 3 apps on the Investec API and here's the link...").
				CharLimit(500).
				Validate(func(s string) error {
					if len(strings.TrimSpace(s)) < 10 {
						return fmt.Errorf("give us a bit more! at least 10 characters")
					}
					return nil
				}),
		),
		// ── Delivery Address ───────────────────────────────
		huh.NewGroup(
			huh.NewInput().
				Key("streetAddress").
				Title("Street address").
				Description("Step 6 of 9 — Where should we deliver? Not detailed = postal /dev/null").
				Placeholder("e.g. 123 Bob's St E").
				Validate(func(s string) error {
					if len(strings.TrimSpace(s)) < 3 {
						return fmt.Errorf("street address is required")
					}
					return nil
				}),
		),
		huh.NewGroup(
			huh.NewInput().
				Key("company").
				Title("Complex or Office (optional)").
				Description("Step 7 of 9 — Leave blank if delivering to home").
				Placeholder("e.g. Recursive Solutions - Sandton, Sandton offices"),
		),
		huh.NewGroup(
			huh.NewInput().
				Key("city").
				Title("Town / City").
				Description("Step 8 of 9").
				Placeholder("e.g. Woodmead, Sandton").
				Validate(func(s string) error {
					if len(strings.TrimSpace(s)) < 2 {
						return fmt.Errorf("city is required")
					}
					return nil
				}),
			huh.NewSelect[string]().
				Key("province").
				Title("Province").
				Options(provinceOptions()...),
		),
		huh.NewGroup(
			huh.NewInput().
				Key("postcode").
				Title("Postcode / ZIP").
				Description("Step 9 of 9 — 4-digit SA postal code").
				Placeholder("e.g. 2191").
				Validate(func(s string) error {
					s = strings.TrimSpace(s)
					if len(s) != 4 {
						return fmt.Errorf("postcode must be 4 digits")
					}
					for _, c := range s {
						if c < '0' || c > '9' {
							return fmt.Errorf("postcode must be numeric")
						}
					}
					return nil
				}),
		),
	).WithShowHelp(true).WithShowErrors(true)
}

func (m Model) formView() string {
	width := m.width
	if width == 0 {
		width = 80
	}

	// Header
	header := m.theme.TextAccent().Bold(true).Render("Request Your Swag")
	headerLine := m.theme.TextMuted().Render("─────────────────────────────────────")

	// Form content
	formContent := m.form.View()

	// Progress bar
	progressBar := m.renderFormProgress(m.formStep)

	// Wrap in a styled container
	container := lipgloss.NewStyle().
		Width(min(width-4, 60)).
		Padding(1, 2)

	content := lipgloss.JoinVertical(lipgloss.Left,
		"",
		header,
		headerLine,
		"",
		progressBar,
		"",
		formContent,
		"",
	)

	center := lipgloss.NewStyle().Width(width).Align(lipgloss.Center)
	return center.Render(container.Render(content))
}

// formUpdate handles keypress events for the form page.
func (m Model) formUpdate(msg tea.Msg) (Model, tea.Cmd) {
	form, cmd := m.form.Update(msg)
	if f, ok := form.(*huh.Form); ok {
		m.form = f
		m.formStep = m.deriveFormStep()
	}

	// Check if form is complete
	if m.form.State == huh.StateCompleted {
		// Extract values from form
		m.formData.FullName = m.form.GetString("fullName")
		m.formData.Email = m.form.GetString("email")
		m.formData.Phone = m.form.GetString("phone")
		m.formData.ShirtSize = m.form.GetString("shirtSize")
		m.formData.Note = m.form.GetString("note")
		m.formData.StreetAddress = m.form.GetString("streetAddress")
		m.formData.Company = m.form.GetString("company")
		m.formData.City = m.form.GetString("city")
		m.formData.Province = m.form.GetString("province")
		m.formData.Postcode = m.form.GetString("postcode")
		m.page = reviewPage
	}

	return m, cmd
}

func (m Model) deriveFormStep() int {
	if m.form == nil {
		return 1
	}

	if m.form.State == huh.StateCompleted {
		return totalFormSteps
	}

	if strings.TrimSpace(m.form.GetString("fullName")) == "" {
		return 1
	}
	if strings.TrimSpace(m.form.GetString("email")) == "" {
		return 2
	}
	if strings.TrimSpace(m.form.GetString("phone")) == "" {
		return 3
	}
	if strings.TrimSpace(m.form.GetString("shirtSize")) == "" {
		return 4
	}
	if strings.TrimSpace(m.form.GetString("note")) == "" {
		return 5
	}
	if strings.TrimSpace(m.form.GetString("streetAddress")) == "" {
		return 6
	}

	city := strings.TrimSpace(m.form.GetString("city"))
	province := strings.TrimSpace(m.form.GetString("province"))
	if city == "" && province == "" {
		return 7
	}
	if city == "" || province == "" {
		return 8
	}
	if strings.TrimSpace(m.form.GetString("postcode")) == "" {
		return 9
	}

	return totalFormSteps
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
