package handlers

import (
	"net/http"
	"voip-backend/database"
	"voip-backend/middleware"
	"voip-backend/models"
	"voip-backend/websocket"

	"github.com/gin-gonic/gin"
)

// GetUsers returns all users (admin only)
func GetUsers(c *gin.Context) {
	var users []models.User
	if err := database.GetDB().Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	// Convert to response format
	var userResponses []models.UserResponse
	var extensions []string

	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
		extensions = append(extensions, user.Extension)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"users":      userResponses,
		"extensions": extensions,
	})
}

// GetOnlineUsers returns all online users
func GetOnlineUsers(c *gin.Context) {
	userID, _, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var users []models.User
	// Get all users except the current user
	if err := database.GetDB().Where("status = ? AND id != ?", "online", userID).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch online users",
		})
		return
	}

	// Convert to response format
	var userResponses []models.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"users":   userResponses,
	})
}

// UpdateUserStatus updates user status
func UpdateUserStatus(c *gin.Context) {
	userID, _, extension, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=online offline busy away"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Update user status
	if err := database.GetDB().Model(&models.User{}).Where("id = ?", userID).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update status",
		})
		return
	}

	// Notify other users via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		hub.NotifyUserStatus(extension, req.Status)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status updated successfully",
		"status":  req.Status,
	})
}

// GetUserByExtension returns user information by extension
func GetUserByExtension(c *gin.Context) {
	extension := c.Param("extension")
	if extension == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Extension parameter required",
		})
		return
	}

	var user models.User
	if err := database.GetDB().Where("extension = ?", extension).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user.ToResponse(),
	})
}

// GetConnectedExtensions returns all currently connected WebSocket extensions
func GetConnectedExtensions(c *gin.Context) {
	hub := websocket.GetHub()
	if hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "WebSocket hub not available",
		})
		return
	}

	extensions := hub.GetConnectedExtensions()

	// Get detailed connection info
	connectionDetails := make(map[string]interface{})
	for _, ext := range extensions {
		clientCount := hub.GetExtensionClientCount(ext)
		connectionDetails[ext] = gin.H{
			"client_count": clientCount,
			"connected":    true,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"extensions":    extensions,
		"count":         len(extensions),
		"details":       connectionDetails,
		"total_clients": hub.GetClientCount(),
	})
}

// GetConnectionStatus returns detailed connection status for debugging
func GetConnectionStatus(c *gin.Context) {
	hub := websocket.GetHub()
	if hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "WebSocket hub not available",
		})
		return
	}

	// Get all users from database
	var users []models.User
	if err := database.GetDB().Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	// Build status report
	statusReport := make([]gin.H, 0)
	for _, user := range users {
		clientCount := hub.GetExtensionClientCount(user.Extension)
		isConnected := hub.IsExtensionConnected(user.Extension)

		statusReport = append(statusReport, gin.H{
			"extension":    user.Extension,
			"username":     user.Username,
			"status":       user.Status,
			"ws_connected": isConnected,
			"client_count": clientCount,
			"status_match": (user.Status == "online") == isConnected,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":              true,
		"connection_status":    statusReport,
		"total_clients":        hub.GetClientCount(),
		"connected_extensions": hub.GetConnectedExtensions(),
	})
}

// GetSystemStats returns system statistics (admin only)
func GetSystemStats(c *gin.Context) {
	// Count total users
	var totalUsers int64
	database.GetDB().Model(&models.User{}).Count(&totalUsers)

	// Count online users
	var onlineUsers int64
	database.GetDB().Model(&models.User{}).Where("status = ?", "online").Count(&onlineUsers)

	// Count active calls
	var activeCalls int64
	database.GetDB().Model(&models.ActiveCall{}).Count(&activeCalls)

	// Count total calls today
	var callsToday int64
	database.GetDB().Model(&models.CallLog{}).Where("DATE(created_at) = DATE(NOW())").Count(&callsToday)

	// Get WebSocket connections
	hub := websocket.GetHub()
	wsConnections := 0
	if hub != nil {
		wsConnections = hub.GetClientCount()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": gin.H{
			"total_users":    totalUsers,
			"online_users":   onlineUsers,
			"active_calls":   activeCalls,
			"calls_today":    callsToday,
			"ws_connections": wsConnections,
		},
	})
}

// DeleteUser deletes a user (admin only)
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User ID parameter required",
		})
		return
	}

	// Check if user exists
	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Don't allow deleting admin users
	if user.Role == "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Cannot delete admin users",
		})
		return
	}

	// Delete user
	if err := database.GetDB().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User deleted successfully",
	})
}
