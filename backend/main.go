package main

import (
	"log"
	"time"
	"voip-backend/asterisk"
	"voip-backend/config"
	"voip-backend/database"
	"voip-backend/handlers"
	"voip-backend/middleware"
	"voip-backend/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize database
	database.InitDatabase()
	defer database.CloseDB()

	// Initialize WebSocket hub
	websocket.InitHub()

	// Initialize Asterisk AMI connection
	if err := asterisk.InitAMI(); err != nil {
		log.Printf("Warning: Failed to initialize AMI connection: %v", err)
		log.Println("Call functionality may be limited")
	}

	// Set Gin mode
	if !config.AppConfig.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin router
	r := gin.Default()

	// Configure trusted proxies for security
	// Only trust specific proxy IPs in production
	trustedProxies := []string{
		"127.0.0.1",      // localhost
		"172.20.10.0/24", // local network range
	}
	if err := r.SetTrustedProxies(trustedProxies); err != nil {
		log.Printf("Warning: Failed to set trusted proxies: %v", err)
	}

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = config.AppConfig.CORSOrigins
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		start := time.Now()
		c.JSON(200, gin.H{
			"status":           "ok",
			"service":          "voip-backend",
			"timestamp":        start.Unix(),
			"response_time_ms": time.Since(start).Milliseconds(),
		})
	})

	// Configuration endpoint for frontend
	r.GET("/config", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"config":  config.AppConfig.GetFrontendConfig(),
		})
	})

	// Configuration update endpoint (for IP configuration)
	r.POST("/config/update", func(c *gin.Context) {
		var updateRequest struct {
			AsteriskHost    string `json:"asterisk_host"`
			AsteriskAMIPort string `json:"asterisk_ami_port"`
			SIPPort         string `json:"sip_port"`
		}

		if err := c.ShouldBindJSON(&updateRequest); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"error":   "Invalid request format",
			})
			return
		}

		// Update configuration if provided
		if updateRequest.AsteriskHost != "" {
			config.AppConfig.AsteriskHost = updateRequest.AsteriskHost
			config.AppConfig.SIPDomain = updateRequest.AsteriskHost
		}
		if updateRequest.AsteriskAMIPort != "" {
			config.AppConfig.AsteriskAMIPort = updateRequest.AsteriskAMIPort
		}
		if updateRequest.SIPPort != "" {
			config.AppConfig.SIPPort = updateRequest.SIPPort
		}

		log.Printf("[Config] Configuration updated: Asterisk=%s:%s, SIP=%s:%s",
			config.AppConfig.AsteriskHost,
			config.AppConfig.AsteriskAMIPort,
			config.AppConfig.AsteriskHost,
			config.AppConfig.SIPPort)

		c.JSON(200, gin.H{
			"success": true,
			"message": "Configuration updated successfully",
			"config":  config.AppConfig.GetFrontendConfig(),
		})
	})

	// WebSocket endpoint
	r.GET("/ws", websocket.HandleWebSocket)

	// Public routes (no authentication required)
	public := r.Group("/api")
	{
		public.POST("/login", handlers.Login)
		public.POST("/register", handlers.Register)
		public.POST("/refresh", handlers.RefreshToken)
		public.POST("/test-asterisk", handlers.TestAsteriskConnectionsPublic)
	}

	// Protected routes (authentication required)
	protected := r.Group("/protected")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/profile", handlers.GetProfile)
		protected.POST("/logout", handlers.Logout)
		protected.PUT("/status", handlers.UpdateUserStatus)
		protected.POST("/heartbeat", handlers.HeartbeatUser)
		protected.GET("/users/online", handlers.GetOnlineUsers)
		protected.GET("/users/:extension", handlers.GetUserByExtension)
		protected.GET("/extensions/connected", handlers.GetConnectedExtensions)
		protected.GET("/extensions/status", handlers.GetConnectionStatus)

		// Call routes
		callRoutes := protected.Group("/call")
		{
			callRoutes.POST("/initiate", handlers.InitiateCall)
			callRoutes.POST("/answer", handlers.AnswerCall)
			callRoutes.POST("/hangup", handlers.HangupCall)
			callRoutes.GET("/active", handlers.GetActiveCalls)
			callRoutes.GET("/logs", handlers.GetCallLogs)
		}

		// Diagnostic routes
		protected.GET("/diagnostics", handlers.GetSystemDiagnostics)
		protected.GET("/test-asterisk", handlers.TestAsteriskConnections)

		// Admin routes
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetUsers)
			admin.DELETE("/users/:id", handlers.DeleteUser)
			admin.GET("/stats", handlers.GetSystemStats)
			admin.DELETE("/call-logs/:id", handlers.DeleteCallLog)
			admin.DELETE("/call-logs/bulk-delete", handlers.BulkDeleteCallLogs)
			admin.GET("/export/call-logs", handlers.ExportCallLogs)
			admin.GET("/metrics/realtime", handlers.GetRealTimeMetrics)

			// System Health endpoints
			admin.GET("/health", handlers.GetSystemHealth)
			admin.GET("/health/fast", handlers.GetFastSystemHealth)

			// Backup endpoints
			admin.POST("/backup", handlers.CreateBackup)
			admin.GET("/backup/status/:id", handlers.GetBackupStatus)
			admin.GET("/backups", handlers.ListBackups)
			admin.GET("/backup/download/:id", handlers.DownloadBackup)
			admin.DELETE("/backup/:id", handlers.DeleteBackup)
			admin.POST("/backup/restore/:id", handlers.RestoreBackup)
		}
	}

	// Start server
	address := config.AppConfig.Host + ":" + config.AppConfig.Port
	log.Printf("Starting VoIP backend server on %s", address)
	log.Printf("Debug mode: %v", config.AppConfig.Debug)
	log.Printf("CORS origins: %v", config.AppConfig.CORSOrigins)

	if err := r.Run(address); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
