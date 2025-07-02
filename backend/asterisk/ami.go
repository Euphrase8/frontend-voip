package asterisk

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"
	"voip-backend/config"
)

type AMIClient struct {
	conn     net.Conn
	reader   *bufio.Reader
	mutex    sync.Mutex
	events   chan AMIEvent
	commands chan AMICommand
	quit     chan bool
}

type AMIEvent struct {
	Type   string
	Fields map[string]string
}

type AMICommand struct {
	Action   string
	Fields   map[string]string
	Response chan AMIResponse
}

type AMIResponse struct {
	Success bool
	Fields  map[string]string
	Error   string
}

var amiClient *AMIClient

// InitAMI initializes the AMI connection
func InitAMI() error {
	client, err := NewAMIClient()
	if err != nil {
		return fmt.Errorf("failed to create AMI client: %v", err)
	}

	amiClient = client
	go amiClient.handleEvents()

	log.Println("AMI client initialized successfully")
	return nil
}

// NewAMIClient creates a new AMI client
func NewAMIClient() (*AMIClient, error) {
	address := fmt.Sprintf("%s:%s", config.AppConfig.AsteriskHost, config.AppConfig.AsteriskAMIPort)

	conn, err := net.DialTimeout("tcp", address, 10*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Asterisk AMI: %v", err)
	}

	client := &AMIClient{
		conn:     conn,
		reader:   bufio.NewReader(conn),
		events:   make(chan AMIEvent, 100),
		commands: make(chan AMICommand, 10),
		quit:     make(chan bool),
	}

	// Read the initial greeting
	_, _, err = client.reader.ReadLine()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to read AMI greeting: %v", err)
	}

	// Login to AMI
	err = client.login()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("AMI login failed: %v", err)
	}

	go client.handleConnection()

	log.Printf("Connected to Asterisk AMI at %s", address)
	return client, nil
}

// login authenticates with the AMI
func (c *AMIClient) login() error {
	loginCmd := fmt.Sprintf("Action: Login\r\nUsername: %s\r\nSecret: %s\r\n\r\n",
		config.AppConfig.AsteriskAMIUsername,
		config.AppConfig.AsteriskAMISecret)

	c.mutex.Lock()
	_, err := c.conn.Write([]byte(loginCmd))
	c.mutex.Unlock()

	if err != nil {
		return err
	}

	// Read login response
	response, err := c.readResponse()
	if err != nil {
		return err
	}

	if response.Fields["Response"] != "Success" {
		return fmt.Errorf("login failed: %s", response.Fields["Message"])
	}

	return nil
}

// handleConnection handles the AMI connection
func (c *AMIClient) handleConnection() {
	for {
		select {
		case cmd := <-c.commands:
			c.executeCommand(cmd)
		case <-c.quit:
			return
		}
	}
}

// handleEvents processes AMI events
func (c *AMIClient) handleEvents() {
	for {
		response, err := c.readResponse()
		if err != nil {
			log.Printf("Error reading AMI response: %v", err)
			continue
		}

		if response.Fields["Event"] != "" {
			event := AMIEvent{
				Type:   response.Fields["Event"],
				Fields: response.Fields,
			}

			select {
			case c.events <- event:
			default:
				log.Println("Event channel full, dropping event")
			}
		}
	}
}

// readResponse reads a complete AMI response
func (c *AMIClient) readResponse() (AMIResponse, error) {
	fields := make(map[string]string)

	for {
		line, err := c.reader.ReadString('\n')
		if err != nil {
			log.Printf("[AMI] Error reading response line: %v", err)
			return AMIResponse{}, err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			break
		}

		parts := strings.SplitN(line, ": ", 2)
		if len(parts) == 2 {
			fields[parts[0]] = parts[1]
		}
	}

	success := fields["Response"] == "Success"

	log.Printf("[AMI] Response received: Success=%t, Fields=%+v", success, fields)

	return AMIResponse{
		Success: success,
		Fields:  fields,
		Error:   fields["Message"],
	}, nil
}

// executeCommand executes an AMI command
func (c *AMIClient) executeCommand(cmd AMICommand) {
	var cmdStr strings.Builder
	cmdStr.WriteString(fmt.Sprintf("Action: %s\r\n", cmd.Action))

	for key, value := range cmd.Fields {
		cmdStr.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	cmdStr.WriteString("\r\n")

	c.mutex.Lock()
	_, err := c.conn.Write([]byte(cmdStr.String()))
	c.mutex.Unlock()

	if err != nil {
		cmd.Response <- AMIResponse{
			Success: false,
			Error:   err.Error(),
		}
		return
	}

	// Read response
	response, err := c.readResponse()
	if err != nil {
		cmd.Response <- AMIResponse{
			Success: false,
			Error:   err.Error(),
		}
		return
	}

	cmd.Response <- response
}

// GetAMIClient returns the global AMI client
func GetAMIClient() *AMIClient {
	return amiClient
}

// SendCommand sends a command to AMI and returns the response
func (c *AMIClient) SendCommand(action string, fields map[string]string) (AMIResponse, error) {
	if c == nil {
		return AMIResponse{}, fmt.Errorf("AMI client not initialized")
	}

	cmd := AMICommand{
		Action:   action,
		Fields:   fields,
		Response: make(chan AMIResponse, 1),
	}

	select {
	case c.commands <- cmd:
	case <-time.After(10 * time.Second):
		return AMIResponse{}, fmt.Errorf("command queue timeout")
	}

	select {
	case response := <-cmd.Response:
		return response, nil
	case <-time.After(30 * time.Second):
		return AMIResponse{}, fmt.Errorf("response timeout after 30 seconds")
	}
}

// GetEvents returns the events channel
func (c *AMIClient) GetEvents() <-chan AMIEvent {
	return c.events
}

// Close closes the AMI connection
func (c *AMIClient) Close() {
	if c.conn != nil {
		c.quit <- true
		c.conn.Close()
	}
}
