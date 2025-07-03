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

	// WebSocket endpoint
	r.GET("/ws", websocket.HandleWebSocket)

	// Public routes (no authentication required)
	public := r.Group("/api")
	{
		public.POST("/login", handlers.Login)
		public.POST("/register", handlers.Register)
		public.POST("/refresh", handlers.RefreshToken)
	}

	// Protected routes (authentication required)
	protected := r.Group("/protected")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/profile", handlers.GetProfile)
		protected.POST("/logout", handlers.Logout)
		protected.PUT("/status", handlers.UpdateUserStatus)
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

		// Admin routes
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetUsers)
			admin.DELETE("/users/:id", handlers.DeleteUser)
			admin.GET("/stats", handlers.GetSystemStats)
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
