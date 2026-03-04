# Technical Specification — SSH Terminal UI

> **Docs version:** 0.1.7 (updated 2026-03-04)  
> See [CHANGELOG.md](../CHANGELOG.md) for release history.

## 1. Overview

The SSH terminal UI is a Go application built with **Bubble Tea** (Charmbracelet) that provides an interactive, branded swag request experience. Users SSH in, fill out a multi-step form, and submit their request — all from their terminal.

**Language:** Go  
**TUI Framework:** Bubble Tea + Lip Gloss + Huh (forms)  
**SSH Server:** Charmbracelet Wish  

---

## 2. Screen Flow

```
SSH Connect
    │
    ▼
┌─────────────────────────────────────────┐
│          SPLASH SCREEN                  │
│                                         │
│   ╔═══════════════════════════════╗      │
│   ║  ██╗███╗   ██╗██╗   ██╗     ║      │
│   ║  ██║████╗  ██║██║   ██║     ║      │
│   ║  ██║██╔██╗ ██║██║   ██║     ║      │
│   ║  ██║██║╚██╗██║╚██╗ ██╔╝     ║      │
│   ║  ██║██║ ╚████║ ╚████╔╝      ║      │
│   ║  ╚═╝╚═╝  ╚═══╝  ╚═══╝      ║      │
│   ╚═══════════════════════════════╝      │
│                                         │
│   Developer Swag Provisioning Terminal  │
│                                         │
│   Initiate a request for Investec       │
│   developer swag.                       │
│                                         │
│   Press ENTER to request swag           │
│   Press 'q' to quit                     │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼ [ENTER]
┌─────────────────────────────────────────┐
│          FORM: Full Name                │
│                                         │
│   Step 1 of 9                           │
│                                         │
│   What's your full name?                │
│   ┌─────────────────────────────┐       │
│   │ Ada Lovelace█               │       │
│   └─────────────────────────────┘       │
│                                         │
│   [TAB] next  [ESC] back  [q] quit     │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼ (repeat for each field)
┌─────────────────────────────────────────┐
│          FORM: Shirt Size               │
│                                         │
│   Step 4 of 9                           │
│                                         │
│   Pick your shirt size:                 │
│                                         │
│      XS   S   M  [L]  XL  XXL          │
│                  ^^^^                    │
│              (selected)                  │
│                                         │
│   [←/→] select  [ENTER] confirm         │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│          FORM: Note                     │
│                                         │
│   Step 5 of 9                           │
│                                         │
│   Tell us why you deserve some swag!    │
│   ┌─────────────────────────────┐       │
│   │ I built 3 apps on the API  │       │
│   │ this year and spoke at the │       │
│   │ community meetup!          │       │
│   │                             │       │
│   └─────────────────────────────┘       │
│                                         │
│   [TAB] next  [ESC] back               │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│          REVIEW                         │
│                                         │
│   ┌─────────────────────────────┐       │
│   │ Name:  Ada Lovelace         │       │
│   │ Email: ada@example.com    │       │
│   │ Phone: +27821234567         │       │
│   │ Size:  L                    │       │
│   │ Note:  I built 3 apps on   │       │
│   │        the API this year... │       │
│   └─────────────────────────────┘       │
│                                         │
│   > Submit Request                      │
│     Edit Details                        │
│     Cancel                              │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼ [Submit]
┌─────────────────────────────────────────┐
│          CONFIRMATION                   │
│                                         │
│   ╔═════════════════════════════╗        │
│   ║   Request Queued          ║        │
│   ║                             ║        │
│   ║   We've received your swag  ║        │
│   ║   request. The team will    ║        │
│   ║   review it shortly.        ║        │
│   ║                             ║        │
│   ║   Request ID: #SW-0042      ║        │
│   ║                             ║        │
│   ╚═════════════════════════════╝        │
│                                         │
│   > Submit another request              │
│     Exit                                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. TUI Architecture

### 3.1 Pages (screens)

```go
const (
    splashPage page = iota    // Welcome screen with ASCII art
    formPage                  // Multi-step form (9 fields including delivery address)
    reviewPage                // Review all entered data
    submittingPage            // Animated progress (spinner + stages) while POST-ing
    confirmPage               // Success confirmation
    errorPage                 // Error display with retry
    rickrollPage              // Easter egg 🤫
)
```

### 3.2 Model Structure

```go
type Model struct {
    // Display
    renderer        *lipgloss.Renderer
    theme           theme.Theme
    width           int
    height          int

    // Navigation
    page            page

    // SSH / identity
    fingerprint     string

    // API
    apiClient       *api.Client

    // Form state
    form            *huh.Form     // Charmbracelet Huh form
    formData        SwagFormData  // Collected form data

    // Review screen
    reviewSelection reviewOption

    // Confirmation screen
    confirmSelection confirmOption
    requestID        string

    // Error
    submitError     error

    // Easter egg
    konamiBuf       []string
    rickLyricIdx    int

    // Submission animation
    spinnerFrame    int
    submitProgress  int
    submitDone      bool
    submitSuccess   bool
}

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
```

### 3.3 Key Bindings

| Key        | Context         | Action                              |
|------------|-----------------|--------------------------------------|
| Enter      | Splash          | Start form                           |
| Tab        | Form            | Next field                           |
| Shift+Tab  | Form            | Previous field                       |
| ←/→        | Size selector   | Change selection                     |
| Enter      | Review          | Execute selected action              |
| Esc        | Any             | Go back one step                     |
| q          | Splash/Confirm  | Quit                                 |
| Ctrl+C     | Any             | Force quit                           |

---

## 4. Theming (Investec Brand)

The theme follows a 95/5 colour discipline:
- **95% core**: Navy (900-300), Stone, Sky 300, White
- **5% accent**: Teal (interactions, success), Burgundy (errors)

```go
// pkg/tui/theme/investec.go

func InvestecTheme(renderer *lipgloss.Renderer) Theme {
    return Theme{
        renderer:   renderer,
        background: lipgloss.Color("#0F2030"),  // Navy 900 — canvas
        border:     lipgloss.Color("#1E3A5F"),  // Navy 700 — dividers
        body:       lipgloss.Color("#B8AFA6"),  // Stone — secondary text
        accent:     lipgloss.Color("#FFFFFF"),  // White — primary text
        brand:      lipgloss.Color("#6B9FC9"),  // Navy 300 — ASCII art
        highlight:  lipgloss.Color("#00A5B5"),  // Teal — interaction cues
        success:    lipgloss.Color("#00A5B5"),  // Teal — progress/success
        errorColor: lipgloss.Color("#8B3A5E"),  // Burgundy — errors
        sky:        lipgloss.Color("#7DD3FC"),  // Sky 300 — meta text
        muted:      lipgloss.Color("#3D6B8E"),  // Navy 500 — dim text
    }
}
```

---

## 5. ASCII Art / Branding

The splash screen should feature:
1. Large ASCII art text: "INVESTEC" or "SWAG" 
2. A tagline: "Developer Community Swag Portal"
3. Subtle animated dots or typing effect during loading
4. Investec-branded color scheme throughout

---

## 6. API Integration

The TUI communicates with the backend API via HTTP:

```go
// pkg/api/client.go

type Client struct {
    BaseURL string
    HTTP    *http.Client
}

func (c *Client) SubmitRequest(req SwagRequest) (*SubmitResponse, error) {
    // POST /api/requests
    // Returns request ID and status
}
```

---

## 7. SSH Server Configuration

```go
// cmd/ssh/main.go

func main() {
    s, err := wish.NewServer(
        wish.WithAddress("0.0.0.0:2222"),
        wish.WithHostKeyPath("./data/host_key"),
        wish.WithMiddleware(
            recover.Middleware(
                bubbletea.Middleware(teaHandler),
                activeterm.Middleware(),
                logging.Middleware(),
            ),
        ),
        // Accept all connections — capture fingerprint for dedup
        wish.WithPublicKeyAuth(func(ctx ssh.Context, key ssh.PublicKey) bool {
            fingerprint := ssh.FingerprintSHA256(key)
            ctx.SetValue("fingerprint", fingerprint)
            return true
        }),
        // Also allow keyboard-interactive (no key)
        wish.WithKeyboardInteractiveAuth(
            func(ctx ssh.Context, challenge gossh.KeyboardInteractiveChallenge) bool {
                ctx.SetValue("fingerprint", "anonymous-"+uuid.NewString())
                return true
            },
        ),
    )
}
```

---

## 8. Form Validation (Client-Side)

| Field     | Validation                                              |
|-----------|----------------------------------------------------------|
| fullName  | Required, 2-100 chars                                   |
| email     | Required, valid email format                            |
| phone     | Required, 7-15 digits (with optional + prefix)         |
| shirtSize | Required, must be one of: XS, S, M, L, XL, XXL         |
| note      | Required, 10-500 chars                                  |
| streetAddress | Required, 3-200 chars                               |
| company   | Optional, max 200 chars                                 |
| city      | Required, 2-100 chars                                   |
| province  | Required, one of 9 SA provinces                         |
| postcode  | Required, 4-digit numeric SA postal code                |

Validation errors displayed inline below each field in error color.

---

## 9. File Structure

```
packages/ssh/
├── cmd/
│   └── ssh/
│       └── main.go          # SSH server entry point
├── pkg/
│   ├── api/
│   │   └── client.go        # API client for backend
│   └── tui/
│       ├── root.go           # Main model, Init, Update, View
│       ├── splash.go         # Splash screen + ASCII art
│       ├── form.go           # Multi-step form (9 steps)
│       ├── review.go         # Review screen
│       ├── confirm.go        # Confirmation + submitting + error screens
│       ├── progress.go       # Progress bars, spinner, transitions
│       ├── rickroll.go       # Easter egg (Konami code)
│       └── theme/
│           └── investec.go   # Investec 95/5 brand theme
├── go.mod
└── go.sum
```
