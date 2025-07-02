package asterisk

import (
	"fmt"
	"log"
	"time"
)

// InitiateCall initiates a call between two extensions
func InitiateCall(fromExtension, toExtension string) (string, error) {
	log.Printf("[AMI] Initiating call from %s to %s", fromExtension, toExtension)

	client := GetAMIClient()
	if client == nil {
		log.Printf("[AMI] ERROR: AMI client not available")
		return "", fmt.Errorf("AMI client not available")
	}

	// Generate unique call ID
	callID := fmt.Sprintf("call-%d", time.Now().Unix())

	// Create the channel name for the caller
	callerChannel := fmt.Sprintf("PJSIP/%s", fromExtension)

	log.Printf("[AMI] Using caller channel: %s", callerChannel)

	// Originate the call
	fields := map[string]string{
		"Channel":  callerChannel,
		"Context":  "default",
		"Exten":    toExtension,
		"Priority": "1",
		"CallerID": fromExtension,
		"Timeout":  "30000", // 30 seconds
		"Variable": fmt.Sprintf("CALL_ID=%s", callID),
		"Async":    "true", // Make it asynchronous to avoid blocking
	}

	log.Printf("[AMI] Sending Originate command with fields: %+v", fields)

	response, err := client.SendCommand("Originate", fields)
	if err != nil {
		log.Printf("[AMI] ERROR: Failed to send originate command: %v", err)
		return "", fmt.Errorf("failed to originate call: %v", err)
	}

	log.Printf("[AMI] Originate response: Success=%t, Error=%s, Fields=%+v",
		response.Success, response.Error, response.Fields)

	if !response.Success {
		log.Printf("[AMI] ERROR: Call origination failed: %s", response.Error)
		return "", fmt.Errorf("call origination failed: %s", response.Error)
	}

	log.Printf("[AMI] SUCCESS: Call initiated from %s to %s (ID: %s, Channel: %s)",
		fromExtension, toExtension, callID, callerChannel)
	return callerChannel, nil
}

// HangupCall hangs up a call on the specified channel
func HangupCall(channel string) error {
	client := GetAMIClient()
	if client == nil {
		return fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel": channel,
	}

	response, err := client.SendCommand("Hangup", fields)
	if err != nil {
		return fmt.Errorf("failed to hangup call: %v", err)
	}

	if !response.Success {
		return fmt.Errorf("hangup failed: %s", response.Error)
	}

	log.Printf("Call hung up on channel: %s", channel)
	return nil
}

// AnswerCall answers a call on the specified channel
func AnswerCall(channel string) error {
	client := GetAMIClient()
	if client == nil {
		return fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel": channel,
	}

	response, err := client.SendCommand("Answer", fields)
	if err != nil {
		return fmt.Errorf("failed to answer call: %v", err)
	}

	if !response.Success {
		return fmt.Errorf("answer failed: %s", response.Error)
	}

	log.Printf("Call answered on channel: %s", channel)
	return nil
}

// GetChannelStatus gets the status of a channel
func GetChannelStatus(channel string) (map[string]string, error) {
	client := GetAMIClient()
	if client == nil {
		return nil, fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel": channel,
	}

	response, err := client.SendCommand("Status", fields)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel status: %v", err)
	}

	return response.Fields, nil
}

// ListChannels lists all active channels
func ListChannels() ([]map[string]string, error) {
	client := GetAMIClient()
	if client == nil {
		return nil, fmt.Errorf("AMI client not available")
	}

	response, err := client.SendCommand("CoreShowChannels", map[string]string{})
	if err != nil {
		return nil, fmt.Errorf("failed to list channels: %v", err)
	}

	// This is a simplified version - in reality, you'd need to parse multiple responses
	var channels []map[string]string
	if response.Success {
		channels = append(channels, response.Fields)
	}

	return channels, nil
}

// GetSIPPeers gets the list of SIP peers (extensions)
func GetSIPPeers() ([]map[string]string, error) {
	client := GetAMIClient()
	if client == nil {
		return nil, fmt.Errorf("AMI client not available")
	}

	response, err := client.SendCommand("SIPpeers", map[string]string{})
	if err != nil {
		return nil, fmt.Errorf("failed to get SIP peers: %v", err)
	}

	// This is a simplified version - in reality, you'd need to parse multiple responses
	var peers []map[string]string
	if response.Success {
		peers = append(peers, response.Fields)
	}

	return peers, nil
}

// GetExtensionStatus checks if an extension is registered and available
func GetExtensionStatus(extension string) (string, error) {
	client := GetAMIClient()
	if client == nil {
		return "unknown", fmt.Errorf("AMI client not available")
	}

	// For PJSIP, we need to use different commands
	// First check if endpoint exists
	endpointFields := map[string]string{
		"Endpoint": extension,
	}

	endpointResponse, err := client.SendCommand("PJSIPShowEndpoint", endpointFields)
	if err != nil {
		return "unknown", fmt.Errorf("failed to check endpoint: %v", err)
	}

	if !endpointResponse.Success {
		return "not_configured", fmt.Errorf("endpoint %s not configured in Asterisk", extension)
	}

	// Check if endpoint has any contacts (is registered)
	contactFields := map[string]string{
		"Contact": fmt.Sprintf("%s/sip:%s@", extension, extension),
	}

	contactResponse, err := client.SendCommand("PJSIPShowContacts", contactFields)
	if err != nil {
		// If we can't get contacts, endpoint exists but may not be registered
		return "configured_not_registered", nil
	}

	if contactResponse.Success {
		return "registered", nil
	}

	return "configured_not_registered", nil
}

// GetDetailedEndpointStatus provides comprehensive endpoint diagnostics
func GetDetailedEndpointStatus(extension string) (map[string]interface{}, error) {
	client := GetAMIClient()
	if client == nil {
		return nil, fmt.Errorf("AMI client not available")
	}

	result := map[string]interface{}{
		"extension":           extension,
		"endpoint_configured": false,
		"contacts":            []map[string]string{},
		"endpoint_details":    map[string]string{},
		"errors":              []string{},
	}

	// Check if endpoint is configured
	endpointFields := map[string]string{
		"Endpoint": extension,
	}

	endpointResponse, err := client.SendCommand("PJSIPShowEndpoint", endpointFields)
	if err != nil {
		result["errors"] = append(result["errors"].([]string), fmt.Sprintf("Failed to check endpoint: %v", err))
		return result, nil
	}

	if endpointResponse.Success {
		result["endpoint_configured"] = true
		result["endpoint_details"] = endpointResponse.Fields
	} else {
		result["errors"] = append(result["errors"].([]string), "Endpoint not configured in Asterisk")
		return result, nil
	}

	// Get contacts for this endpoint
	contactResponse, err := client.SendCommand("PJSIPShowContacts", map[string]string{})
	if err != nil {
		result["errors"] = append(result["errors"].([]string), fmt.Sprintf("Failed to get contacts: %v", err))
	} else if contactResponse.Success {
		// Note: In a real implementation, you'd parse multiple contact responses
		// For now, we'll just include the response fields
		contacts := []map[string]string{contactResponse.Fields}
		result["contacts"] = contacts
	}

	return result, nil
}

// TransferCall transfers a call to another extension
func TransferCall(channel, extension string) error {
	client := GetAMIClient()
	if client == nil {
		return fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel":  channel,
		"Exten":    extension,
		"Context":  "default",
		"Priority": "1",
	}

	response, err := client.SendCommand("Redirect", fields)
	if err != nil {
		return fmt.Errorf("failed to transfer call: %v", err)
	}

	if !response.Success {
		return fmt.Errorf("transfer failed: %s", response.Error)
	}

	log.Printf("Call transferred on channel %s to extension %s", channel, extension)
	return nil
}

// HoldCall puts a call on hold
func HoldCall(channel string) error {
	client := GetAMIClient()
	if client == nil {
		return fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel": channel,
		"Class":   "hold",
	}

	response, err := client.SendCommand("MusicOnHold", fields)
	if err != nil {
		return fmt.Errorf("failed to hold call: %v", err)
	}

	if !response.Success {
		return fmt.Errorf("hold failed: %s", response.Error)
	}

	log.Printf("Call put on hold: %s", channel)
	return nil
}

// UnholdCall removes a call from hold
func UnholdCall(channel string) error {
	client := GetAMIClient()
	if client == nil {
		return fmt.Errorf("AMI client not available")
	}

	fields := map[string]string{
		"Channel": channel,
	}

	response, err := client.SendCommand("StopMusicOnHold", fields)
	if err != nil {
		return fmt.Errorf("failed to unhold call: %v", err)
	}

	if !response.Success {
		return fmt.Errorf("unhold failed: %s", response.Error)
	}

	log.Printf("Call removed from hold: %s", channel)
	return nil
}
