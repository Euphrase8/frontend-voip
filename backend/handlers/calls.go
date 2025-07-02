package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"
	"voip-backend/asterisk"
	"voip-backend/database"
	"voip-backend/middleware"
	"voip-backend/models"
	"voip-backend/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// InitiateCall handles call initiation
func InitiateCall(c *gin.Context) {
	userID, username, extension, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req models.CallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format: " + err.Error(),
		})
		return
	}

	// Check if we should use WebRTC direct calling instead of AMI
	useWebRTC := c.Query("method") == "webrtc" || c.GetHeader("X-Call-Method") == "webrtc"

	if useWebRTC {
		initiateWebRTCCall(c, userID, username, extension, req)
		return
	}

	// Log the call initiation request
	log.Printf("[CALL] User %s (ext: %s) initiating call to %s", username, extension, req.TargetExtension)

	// Validate target extension exists
	var targetUser models.User
	if err := database.GetDB().Where("extension = ?", req.TargetExtension).First(&targetUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("[CALL] ERROR: Target extension %s not found", req.TargetExtension)
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Target extension not found",
			})
			return
		}
		log.Printf("[CALL] ERROR: Database error looking up extension %s: %v", req.TargetExtension, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database error",
		})
		return
	}

	log.Printf("[CALL] Target user found: %s (ext: %s, status: %s)", targetUser.Username, targetUser.Extension, targetUser.Status)

	// Check if target user is online
	if targetUser.Status != "online" {
		log.Printf("[CALL] ERROR: Target user %s is not online (status: %s)", targetUser.Username, targetUser.Status)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Target extension is not online",
		})
		return
	}

	// Check if caller is trying to call themselves
	if extension == req.TargetExtension {
		log.Printf("[CALL] ERROR: User %s trying to call themselves", username)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot call yourself",
		})
		return
	}

	log.Printf("[CALL] Initiating Asterisk call from %s to %s", extension, req.TargetExtension)

	// Initiate call through Asterisk
	channel, err := asterisk.InitiateCall(extension, req.TargetExtension)
	if err != nil {
		log.Printf("[CALL] ERROR: Asterisk call initiation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initiate call: " + err.Error(),
		})
		return
	}

	log.Printf("[CALL] Asterisk call initiated successfully, channel: %s", channel)

	// Create call log entry
	callLog := models.CallLog{
		CallerID:  userID,
		CalleeID:  targetUser.ID,
		StartTime: time.Now(),
		Status:    "initiated",
		Channel:   channel,
		Direction: "outbound",
	}

	if err := database.GetDB().Create(&callLog).Error; err != nil {
		// Log error but don't fail the call
		c.Header("X-Warning", "Failed to create call log")
	}

	// Create active call entry
	activeCall := models.ActiveCall{
		CallerID:  userID,
		CalleeID:  targetUser.ID,
		Channel:   channel,
		Status:    "ringing",
		StartTime: time.Now(),
	}

	if err := database.GetDB().Create(&activeCall).Error; err != nil {
		// Log error but don't fail the call
		c.Header("X-Warning", "Failed to create active call record")
	}

	// Notify target user via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		hub.NotifyIncomingCall(extension, req.TargetExtension, channel)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Call initiated successfully",
		"channel": channel,
		"caller":  username,
		"callee":  targetUser.Username,
	})
}

// AnswerCall handles call answering
func AnswerCall(c *gin.Context) {
	userID, _, extension, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req models.CallAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Find the active call
	var activeCall models.ActiveCall
	if err := database.GetDB().Where("channel = ? AND callee_id = ?", req.Channel, userID).First(&activeCall).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Active call not found",
		})
		return
	}

	// Answer the call through Asterisk
	if err := asterisk.AnswerCall(req.Channel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to answer call: " + err.Error(),
		})
		return
	}

	// Update active call status
	database.GetDB().Model(&activeCall).Update("status", "connected")

	// Update call log
	database.GetDB().Model(&models.CallLog{}).Where("channel = ?", req.Channel).Updates(map[string]interface{}{
		"status": "answered",
	})

	// Notify via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		// Get caller info
		var caller models.User
		if err := database.GetDB().First(&caller, activeCall.CallerID).Error; err == nil {
			hub.NotifyCallStatus(caller.Extension, extension, "connected", req.Channel)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Call answered successfully",
		"channel": req.Channel,
	})
}

// HangupCall handles call termination
func HangupCall(c *gin.Context) {
	userID, _, extension, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req models.CallHangupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Find the active call
	var activeCall models.ActiveCall
	if err := database.GetDB().Where("channel = ? AND (caller_id = ? OR callee_id = ?)", req.Channel, userID, userID).First(&activeCall).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Active call not found",
		})
		return
	}

	// Hangup the call through Asterisk
	if err := asterisk.HangupCall(req.Channel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to hangup call: " + err.Error(),
		})
		return
	}

	// Calculate call duration
	duration := int(time.Since(activeCall.StartTime).Seconds())

	// Update call log
	endTime := time.Now()
	database.GetDB().Model(&models.CallLog{}).Where("channel = ?", req.Channel).Updates(map[string]interface{}{
		"status":   "ended",
		"end_time": &endTime,
		"duration": duration,
	})

	// Remove active call
	database.GetDB().Delete(&activeCall)

	// Notify via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		// Get other party info
		var otherUser models.User
		if activeCall.CallerID == userID {
			database.GetDB().First(&otherUser, activeCall.CalleeID)
		} else {
			database.GetDB().First(&otherUser, activeCall.CallerID)
		}

		if otherUser.ID != 0 {
			hub.NotifyCallStatus(extension, otherUser.Extension, "ended", req.Channel)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "Call ended successfully",
		"channel":  req.Channel,
		"duration": duration,
	})
}

// GetActiveCalls returns all active calls for the user
func GetActiveCalls(c *gin.Context) {
	userID, _, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var activeCalls []models.ActiveCall
	if err := database.GetDB().Preload("Caller").Preload("Callee").Where("caller_id = ? OR callee_id = ?", userID, userID).Find(&activeCalls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch active calls",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"active_calls": activeCalls,
	})
}

// GetCallLogs returns call history for the user
func GetCallLogs(c *gin.Context) {
	userID, _, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var callLogs []models.CallLog
	if err := database.GetDB().Preload("Caller").Preload("Callee").Where("caller_id = ? OR callee_id = ?", userID, userID).Order("created_at DESC").Limit(50).Find(&callLogs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch call logs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"call_logs": callLogs,
	})
}

// GetSystemDiagnostics provides diagnostic information about the VoIP system
func GetSystemDiagnostics(c *gin.Context) {
	diagnostics := map[string]interface{}{
		"timestamp":  time.Now().Format(time.RFC3339),
		"ami_status": "unknown",
		"endpoints":  []map[string]interface{}{},
		"errors":     []string{},
	}

	// Check AMI connection
	client := asterisk.GetAMIClient()
	if client == nil {
		diagnostics["ami_status"] = "disconnected"
		diagnostics["errors"] = append(diagnostics["errors"].([]string), "AMI client not available")
	} else {
		diagnostics["ami_status"] = "connected"

		// Check specific endpoints that are failing
		problematicExtensions := []string{"1001", "1004", "1000"}
		for _, ext := range problematicExtensions {
			// Get detailed endpoint status
			endpointDetails, err := asterisk.GetDetailedEndpointStatus(ext)
			if err != nil {
				endpointInfo := map[string]interface{}{
					"extension": ext,
					"status":    "error",
					"error":     err.Error(),
				}
				diagnostics["endpoints"] = append(diagnostics["endpoints"].([]map[string]interface{}), endpointInfo)
				diagnostics["errors"] = append(diagnostics["errors"].([]string),
					fmt.Sprintf("Extension %s error: %v", ext, err))
			} else {
				diagnostics["endpoints"] = append(diagnostics["endpoints"].([]map[string]interface{}), endpointDetails)

				// Add any endpoint-specific errors to the main errors list
				if endpointErrors, ok := endpointDetails["errors"].([]string); ok {
					for _, endpointError := range endpointErrors {
						diagnostics["errors"] = append(diagnostics["errors"].([]string),
							fmt.Sprintf("Extension %s: %s", ext, endpointError))
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"diagnostics": diagnostics,
	})
}

// initiateWebRTCCall handles WebRTC-based call initiation
func initiateWebRTCCall(c *gin.Context, userID uint, username, extension string, req models.CallRequest) {
	log.Printf("[WEBRTC] User %s (ext: %s) initiating WebRTC call to %s", username, extension, req.TargetExtension)

	// Find target user
	var targetUser models.User
	if err := database.GetDB().Where("extension = ?", req.TargetExtension).First(&targetUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Target extension not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database error",
		})
		return
	}

	log.Printf("[WEBRTC] Target user found: %s (ext: %s, status: %s)", targetUser.Username, targetUser.Extension, targetUser.Status)

	// Check if target user is online
	if targetUser.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Target user is not online",
		})
		return
	}

	// Check if target user has active WebSocket connection
	hub := websocket.GetHub()
	if hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "WebSocket hub not available",
		})
		return
	}

	if !hub.IsExtensionConnected(req.TargetExtension) {
		clientCount := hub.GetExtensionClientCount(req.TargetExtension)
		log.Printf("[WEBRTC] Extension %s has %d WebSocket clients connected", req.TargetExtension, clientCount)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Target extension %s is not connected via WebSocket (user status: %s, ws clients: %d)",
				req.TargetExtension, targetUser.Status, clientCount),
		})
		return
	}

	// Generate call ID
	callID := fmt.Sprintf("webrtc-call-%d", time.Now().Unix())

	// Create call log entry
	callLog := models.CallLog{
		CallerID:  userID,
		CalleeID:  targetUser.ID,
		StartTime: time.Now(),
		Status:    "initiated",
		Channel:   callID,
		Direction: "outbound",
	}

	if err := database.GetDB().Create(&callLog).Error; err != nil {
		log.Printf("[WEBRTC] ERROR: Failed to create call log: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create call log",
		})
		return
	}

	// Send WebRTC call invitation via WebSocket
	if hub != nil {
		callInvitation := map[string]interface{}{
			"type":             "webrtc_call_invitation",
			"call_id":          callID,
			"caller_id":        userID,
			"caller_username":  username,
			"caller_extension": extension,
			"target_extension": req.TargetExtension,
			"timestamp":        time.Now().Format(time.RFC3339),
		}

		// Send to target user
		if err := hub.SendToExtension(req.TargetExtension, callInvitation); err != nil {
			log.Printf("[WEBRTC] ERROR: Failed to send call invitation to %s: %v", req.TargetExtension, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to notify target user",
			})
			return
		}

		// Send confirmation to caller
		callerConfirmation := map[string]interface{}{
			"type":    "webrtc_call_initiated",
			"call_id": callID,
			"status":  "calling",
			"target":  req.TargetExtension,
		}

		if err := hub.SendToExtension(extension, callerConfirmation); err != nil {
			log.Printf("[WEBRTC] WARNING: Failed to send confirmation to caller %s: %v", extension, err)
		}
	}

	log.Printf("[WEBRTC] WebRTC call invitation sent successfully, call ID: %s", callID)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "WebRTC call initiated successfully",
		"call_id":  callID,
		"method":   "webrtc",
		"target":   req.TargetExtension,
		"channel":  callID,
		"priority": "1",
	})
}
