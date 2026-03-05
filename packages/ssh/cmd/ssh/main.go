package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/log"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/activeterm"
	"github.com/charmbracelet/wish/bubbletea"
	"github.com/charmbracelet/wish/logging"
	gossh "golang.org/x/crypto/ssh"

	"github.com/investec-community/swag-ssh/pkg/tui"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-signalChan
		cancel()
	}()

	sshPort := os.Getenv("SSH_PORT")
	if sshPort == "" {
		sshPort = "2222"
	}

	hostKeyPath := os.Getenv("SSH_HOST_KEY_PATH")
	if hostKeyPath == "" {
		hostKeyPath = "./data/host_key"
	}

	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}

	s, err := wish.NewServer(
		wish.WithAddress(net.JoinHostPort("0.0.0.0", sshPort)),
		wish.WithHostKeyPath(hostKeyPath),
		wish.WithMiddleware(
			bubbletea.Middleware(func(s ssh.Session) (tea.Model, []tea.ProgramOption) {
				renderer := bubbletea.MakeRenderer(s)
				fingerprint, _ := s.Context().Value("fingerprint").(string)

				m := tui.NewModel(renderer, fingerprint, apiURL)
				return m, []tea.ProgramOption{tea.WithAltScreen()}
			}),
			activeterm.Middleware(),
			logging.Middleware(),
		),
		// Accept all SSH connections — capture fingerprint for dedup
		wish.WithPublicKeyAuth(func(ctx ssh.Context, key ssh.PublicKey) bool {
			fingerprint := gossh.FingerprintSHA256(key)
			ctx.SetValue("fingerprint", fingerprint)
			return true
		}),
		// Also allow keyboard-interactive (no key)
		wish.WithKeyboardInteractiveAuth(
			func(ctx ssh.Context, challenger gossh.KeyboardInteractiveChallenge) bool {
				ctx.SetValue("fingerprint", "anon-"+uuid.NewString())
				return true
			},
		),
	)
	if err != nil {
		log.Error("Could not create server", "error", err)
		os.Exit(1)
	}

	slog.Info("Starting Investec Swag SSH server", "port", sshPort)
	go func() {
		if err = s.ListenAndServe(); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
			log.Error("Server error", "error", err)
			cancel()
		}
	}()

	<-ctx.Done()
	slog.Info("Shutting down SSH server...")
	s.Close()
}
