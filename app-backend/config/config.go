package config

import (
    "os"
    "strconv"
    "time"
)

// Config holds all configuration for the application
type Config struct {
    Server  ServerConfig
    MongoDB MongoDBConfig
    JWT     JWTConfig
}

// ServerConfig holds server related configuration
type ServerConfig struct {
    Port         string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

// MongoDBConfig holds MongoDB related configuration
type MongoDBConfig struct {
    URI      string
    Database string
}

// JWTConfig holds JWT related configuration
type JWTConfig struct {
    Secret    string
    ExpiresIn time.Duration
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
    // Default values
    port := getEnv("PORT", "8080")
    readTimeout, _ := strconv.Atoi(getEnv("READ_TIMEOUT", "10"))
    writeTimeout, _ := strconv.Atoi(getEnv("WRITE_TIMEOUT", "10"))
    jwtExpiresIn, _ := strconv.Atoi(getEnv("JWT_EXPIRES_IN", "24"))

    return &Config{
        Server: ServerConfig{
            Port:         port,
            ReadTimeout:  time.Duration(readTimeout) * time.Second,
            WriteTimeout: time.Duration(writeTimeout) * time.Second,
        },
        MongoDB: MongoDBConfig{
            URI:      getEnv("MONGODB_URI", "mongodb+srv://kulkarniom7057:BwblKbFIJ6R8Uut3@counsconnect.escoesk.mongodb.net"),
            Database: getEnv("MONGODB_DATABASE", "CounsConnect"),
        },
        JWT: JWTConfig{
            Secret:    getEnv("JWT_SECRET", "your-secret-key"),
            ExpiresIn: time.Duration(jwtExpiresIn) * time.Hour,
        },
    }, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    return value
}