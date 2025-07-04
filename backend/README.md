# VoIP Backend

A Go-based backend server for the VoIP web application that integrates with Asterisk PBX for call management.

## Features

- **User Authentication**: JWT-based authentication with login/register/logout
- **Call Management**: Initiate, answer, and hangup calls through Asterisk AMI
- **Real-time Communication**: WebSocket server for real-time call notifications
- **User Management**: User status tracking and extension management
- **Call Logging**: Complete call history and active call tracking
- **Admin Panel**: Administrative functions for user and system management

## Prerequisites

- Go 1.21 or higher
- Asterisk PBX with AMI enabled
- SQLite (included with Go)

## Installation

1. **Clone and setup the project:**
   ```bash
   cd backend
   go mod tidy
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure Asterisk AMI:**
   
   Edit `/etc/asterisk/manager.conf`:
   ```ini
   [general]
   enabled = yes
   port = 5038
   bindaddr = 0.0.0.0

   [admin]
   secret = amp111
   read = all
   write = all
   ```

   Edit `/etc/asterisk/http.conf`:
   ```ini
   [general]
   enabled=yes
   bindaddr=0.0.0.0
   bindport=8088
   ```

   Edit `/etc/asterisk/pjsip.conf`:
   ```ini
   [transport-ws]
   type=transport
   protocol=ws
   bind=0.0.0.0:8088

   [1000]
   type=endpoint
   context=default
   disallow=all
   allow=ulaw,alaw
   transport=transport-ws
   auth=1000
   aors=1000

   [1000]
   type=auth
   auth_type=userpass
   password=password1000
   username=1000

   [1000]
   type=aor
   max_contacts=5
   ```

4. **Run the server:**
   ```bash
   go run main.go
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Server host | `0.0.0.0` |
| `JWT_SECRET` | JWT signing secret | `default-secret-change-this` |
| `JWT_EXPIRY_HOURS` | JWT token expiry | `24` |
| `DB_PATH` | SQLite database path | `./voip.db` |
| `ASTERISK_HOST` | Asterisk server IP | `172.20.10.5` |
| `ASTERISK_AMI_PORT` | Asterisk AMI port | `5038` |
| `ASTERISK_AMI_USERNAME` | AMI username | `admin` |
| `ASTERISK_AMI_SECRET` | AMI password | `amp111` |
| `SIP_DOMAIN` | SIP domain | `172.20.10.5` |
| `SIP_PORT` | SIP port | `8088` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `DEBUG` | Debug mode | `true` |

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/refresh` - Refresh JWT token

### User Management
- `GET /protected/profile` - Get user profile
- `POST /protected/logout` - User logout
- `PUT /protected/status` - Update user status
- `GET /protected/users/online` - Get online users
- `GET /protected/users/:extension` - Get user by extension

### Call Management
- `POST /protected/call/initiate` - Initiate a call
- `POST /protected/call/answer` - Answer a call
- `POST /protected/call/hangup` - Hangup a call
- `GET /protected/call/active` - Get active calls
- `GET /protected/call/logs` - Get call history

### Admin (Admin role required)
- `GET /protected/admin/users` - Get all users
- `DELETE /protected/admin/users/:id` - Delete user
- `GET /protected/admin/stats` - Get system statistics

### WebSocket
- `GET /ws?extension=<extension>` - WebSocket connection for real-time updates

## Default Users

The system creates default users on first run:

| Username | Password | Extension | Role |
|----------|----------|-----------|------|
| `admin` | `password` | `1000` | `admin` |
| `user1` | `password` | `1001` | `user` |
| `user2` | `password` | `1002` | `user` |
| `user3` | `password` | `1003` | `user` |

## WebSocket Messages

### Incoming Messages
- `ping` - Heartbeat ping
- `call_status` - Call status updates
- `hangup` - Call hangup notification
- `answer_call` - Call answer notification
- `user_status` - User status updates

### Outgoing Messages
- `welcome` - Connection welcome
- `pong` - Heartbeat response
- `incoming_call` - Incoming call notification
- `call_status` - Call status updates
- `user_status` - User status broadcasts

## Troubleshooting

### Common Issues

1. **AMI Connection Failed**
   - Check Asterisk AMI configuration
   - Verify network connectivity
   - Check firewall settings

2. **WebSocket Connection Issues**
   - Verify CORS configuration
   - Check frontend WebSocket URL
   - Ensure proper authentication

3. **Call Initiation Fails**
   - Check Asterisk dialplan
   - Verify SIP endpoint configuration
   - Check extension registration

### Logs

Enable debug mode for detailed logging:
```bash
DEBUG=true go run main.go
```

## Development

### Project Structure
```
backend/
├── asterisk/          # Asterisk AMI integration
├── auth/              # JWT authentication
├── config/            # Configuration management
├── database/          # Database setup and migrations
├── handlers/          # HTTP request handlers
├── middleware/        # HTTP middleware
├── models/            # Data models
├── websocket/         # WebSocket server
├── main.go           # Application entry point
├── go.mod            # Go module definition
└── README.md         # This file
```

### Adding New Features

1. Define models in `models/`
2. Create handlers in `handlers/`
3. Add routes in `main.go`
4. Update database migrations in `database/`

## License

This project is licensed under the MIT License.
