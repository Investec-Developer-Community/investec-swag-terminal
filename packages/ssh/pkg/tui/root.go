package tui

import (
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"

	"github.com/investec-community/swag-ssh/pkg/api"
	"github.com/investec-community/swag-ssh/pkg/tui/theme"
)

// ── Pages ──────────────────────────────────────────────────────

type page int

const (
	splashPage page = iota
	formPage
	reviewPage
	submittingPage
	confirmPage
	errorPage
	rickrollPage
)

// ── Form Data ──────────────────────────────────────────────────

type SwagFormData struct {
	FullName      string
	Email         string
	Phone         string
	ShirtSize     string
	Note          string
	StreetAddress string
	Company       string
	City          string
	Province      string
	Postcode      string
}

// ── Messages ───────────────────────────────────────────────────

type submitSuccessMsg struct {
	id string
}

type submitErrorMsg struct {
	err error
}

// ── Model ──────────────────────────────────────────────────────

type Model struct {
	// Display
	renderer *lipgloss.Renderer
	theme    theme.Theme
	width    int
	height   int

	// Navigation
	page page

	// SSH / identity
	fingerprint string

	// API
	apiClient *api.Client

	// Form
	form     *huh.Form
	formData SwagFormData

	// Review screen
	reviewSelection reviewOption

	// Confirmation screen
	confirmSelection confirmOption
	requestID        string

	// Error
	submitError error

	// Easter egg
	konamiBuf    []string
	rickLyricIdx int

	// Submission animation
	spinnerFrame   int
	submitProgress int
	submitDone     bool
	submitSuccess  bool
}

// NewModel creates the initial TUI model.
func NewModel(renderer *lipgloss.Renderer, fingerprint string, apiURL string) Model {
	t := theme.InvestecTheme(renderer)
	return Model{
		renderer:    renderer,
		theme:       t,
		page:        splashPage,
		fingerprint: fingerprint,
		apiClient:   api.NewClient(apiURL),
	}
}

// ── Bubble Tea Interface ───────────────────────────────────────

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	// Window resize
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	// API response messages
	case submitSuccessMsg:
		m.requestID = msg.id
		m.submitDone = true
		m.submitSuccess = true
		return m, transitionDelay()

	case submitErrorMsg:
		m.submitError = msg.err
		m.submitDone = true
		m.submitSuccess = false
		return m, transitionDelay()

	// Submission animation ticks
	case spinnerTickMsg:
		if m.page == submittingPage {
			m.spinnerFrame = (m.spinnerFrame + 1) % len(spinnerFrames)
			return m, spinnerTick()
		}
		return m, nil

	case progressStepMsg:
		if m.page == submittingPage && !m.submitDone {
			if m.submitProgress < len(submitSteps)-1 {
				m.submitProgress++
				return m, progressStep()
			}
		}
		return m, nil

	case transitionDoneMsg:
		if m.page == submittingPage && m.submitDone {
			if m.submitSuccess {
				m.page = confirmPage
			} else {
				m.page = errorPage
			}
		}
		return m, nil
	}

	// Page-specific updates
	switch m.page {
	case splashPage:
		return m.splashUpdate(msg)
	case formPage:
		return m.formUpdate(msg)
	case reviewPage:
		return m.reviewUpdate(msg)
	case confirmPage:
		return m.confirmUpdate(msg)
	case errorPage:
		return m.errorUpdate(msg)
	case rickrollPage:
		return m.rickrollUpdate(msg)
	}

	return m, nil
}

func (m Model) View() string {
	switch m.page {
	case splashPage:
		return m.splashView()
	case formPage:
		return m.formView()
	case reviewPage:
		return m.reviewView()
	case submittingPage:
		return m.submittingView()
	case confirmPage:
		return m.confirmView()
	case errorPage:
		return m.errorView()
	case rickrollPage:
		return m.rickrollView()
	}
	return ""
}

// ── Splash Screen Key Handling ─────────────────────────────────

func (m Model) splashUpdate(msg tea.Msg) (Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			m.page = formPage
			m.initForm()
			return m, m.form.Init()
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

// ── Error Screen Key Handling ──────────────────────────────────

func (m Model) errorUpdate(msg tea.Msg) (Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			m.page = submittingPage
			m.spinnerFrame = 0
			m.submitProgress = 0
			m.submitDone = false
			m.submitSuccess = false
			return m, tea.Batch(m.submitRequest(), spinnerTick(), progressStep())
		case "esc":
			m.page = reviewPage
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

// ── Submit Request ─────────────────────────────────────────────

func (m Model) submitRequest() tea.Cmd {
	return func() tea.Msg {
		resp, err := m.apiClient.SubmitSwagRequest(api.SwagRequest{
			FullName:      m.formData.FullName,
			Email:         m.formData.Email,
			Phone:         m.formData.Phone,
			ShirtSize:     m.formData.ShirtSize,
			Note:          m.formData.Note,
			StreetAddress: m.formData.StreetAddress,
			Company:       m.formData.Company,
			City:          m.formData.City,
			Province:      m.formData.Province,
			Postcode:      m.formData.Postcode,
			Fingerprint:   m.fingerprint,
		})
		if err != nil {
			return submitErrorMsg{err: err}
		}
		return submitSuccessMsg{id: resp.ID}
	}
}
