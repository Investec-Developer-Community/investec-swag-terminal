package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client communicates with the Investec Swag API backend.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new API client.
func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SwagRequest represents the data collected from the SSH form.
type SwagRequest struct {
	FullName      string `json:"fullName"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	ShirtSize     string `json:"shirtSize"`
	Note          string `json:"note"`
	StreetAddress string `json:"streetAddress"`
	Company       string `json:"company,omitempty"`
	City          string `json:"city"`
	Province      string `json:"province"`
	Postcode      string `json:"postcode"`
	Fingerprint   string `json:"fingerprint,omitempty"`
}

// SubmitResponse is the API's response after submitting a swag request.
type SubmitResponse struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	Message   string `json:"message"`
}

// APIError represents an error from the API.
type APIError struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// SubmitSwagRequest sends a new swag request to the API.
func (c *Client) SubmitSwagRequest(req SwagRequest) (*SubmitResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.HTTPClient.Post(
		c.BaseURL+"/api/requests",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to submit request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		var apiErr APIError
		json.NewDecoder(resp.Body).Decode(&apiErr)
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, apiErr.Error.Message)
	}

	var result SubmitResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}
