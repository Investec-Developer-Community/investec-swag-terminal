# Technical Specification — SSH Terminal UI

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
│   Welcome to the Investec Developer     │
│   Swag Portal! 🎁                       │
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
│   Step 1 of 5                           │
│                                         │
│   What's your full name?                │
│   ┌─────────────────────────────┐       │
│   │ Sipho Mabena█               │       │
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
│   Step 4 of 5                           │
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
│   Step 5 of 5                           │
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
│   │ Name:  Sipho Mabena         │       │
│   │ Email: sipho@example.com    │       │
│   │ Phone: +27821234567         │       │
│   │ Size:  L                    │       │
│   │ Note:  I built 3 apps on   │       │
│   │        the API this year... │       │
│   └─────────────────────────────┘       │
│                                         │
│   ☉ Submit Request                      │
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
│   ║                             ║        │
│   ║   🎉 You're in the queue!  ║        │
│   ║                             ║        │
│   ║   We've received your swag  ║        │
│   ║   request. The team will    ║        │
│   ║   review it shortly.        ║        │
│   ║                             ║        │
│   ║   Request ID: #SW-0042      ║        │
│   ║                             ║        │
│   ╚═════════════════════════════╝        │
│                                         │
│   ☉ Submit another request              │
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
    formPage                  // Multi-step form (name, email, phone, size, note)
    reviewPage                // Review all entered data
    submittingPage            // Loading state while POST-ing
    confirmPage               // Success confirmation
    errorPage                 // Error display with retry
)
```

### 3.2 Model Structure

```go
type model struct {
    // App state
    ready           bool
    page            page
    renderer        *lipgloss.Renderer
    theme           Theme

    // Terminal info
    width           int
    height          int
    fingerprint     string
    ipAddress       string

    // Form state
    formStep        int           // 0-4 (name, email, phone, size, note)
    form            *huh.Form     // Charmbracelet Huh form
    formData        SwagRequest   // Collected form data

    // Submission
    submitting      bool
    submitError     error
    requestID       string

    // UI components
    spinner         spinner.Model
}

type SwagRequest struct {
    FullName    string
    Email       string
    Phone       string
    ShirtSize   string
    Note        string
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

```go
// pkg/tui/theme/investec.go

func InvestecTheme(renderer *lipgloss.Renderer) Theme {
    return Theme{
        renderer:   renderer,
        background: lipgloss.Color("#001B2E"),  // Deep navy
        border:     lipgloss.Color("#004A7C"),  // Mid blue
        body:       lipgloss.Color("#8FAFC1"),  // Light blue-grey
        accent:     lipgloss.Color("#FFFFFF"),  // White text
        brand:      lipgloss.Color("#003D6A"),  // Investec Blue
        highlight:  lipgloss.Color("#00A5B5"),  // Investec Teal
        success:    lipgloss.Color("#D4A843"),  // Gold
        error:      lipgloss.Color("#E85D5D"),  // Red
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
│       ├── splash.go         # Splash screen
│       ├── form.go           # Multi-step form
│       ├── review.go         # Review screen
│       ├── confirm.go        # Confirmation screen
│       ├── error.go          # Error display
│       ├── styles.go         # Shared style helpers
│       ├── keys.go           # Key bindings
│       └── theme/
│           └── investec.go   # Investec brand theme
├── go.mod
└── go.sum
```
