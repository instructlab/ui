package main

import (
	"fmt"

	"go.uber.org/zap"
)

// -----------------------------------------------------------------------------
// Logger Initialization
// -----------------------------------------------------------------------------
func (srv *ILabServer) initLogger(debug bool) {
	var cfg zap.Config

	if debug {
		cfg = zap.NewDevelopmentConfig()
		cfg.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	} else {
		cfg = zap.NewProductionConfig()
		cfg.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}

	logger, err := cfg.Build()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize zap logger: %v", err))
	}

	srv.logger = logger
	srv.log = logger.Sugar()

	if debug {
		srv.log.Debug("Debug logging is enabled.")
	}
}
