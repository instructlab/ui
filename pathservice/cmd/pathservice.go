package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/config"
	"gopkg.in/src-d/go-git.v4/plumbing"
)

const (
	repoURL         = "https://github.com/instructlab/taxonomy"
	repoDir         = "/tmp/taxonomy"
	checkInterval   = 1 * time.Minute // Interval for checking updates
	serviceLogLevel = "IL_UI_DEPLOYMENT"
	SKILLS          = "skills/"
	KNOWLEDGE       = "knowledge/"
)

type PathService struct {
	ctx        context.Context
	logger     *zap.SugaredLogger
	wg         *sync.WaitGroup
	httpServer *http.Server
}

func NewPathService(ctx context.Context, logger *zap.SugaredLogger) *PathService {
	return &PathService{
		ctx:    ctx,
		logger: logger,
	}

}

func (ps *PathService) cloneRepo() error {
	// check if the repo directory exists
	if _, err := os.Stat(repoDir); err == nil {
		ps.logger.Errorf("Repository already exists at %s, skip cloning", repoDir)
		return nil
	}
	_, err := git.PlainClone(repoDir, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})
	return err
}

func (ps *PathService) deleteRepo() error {
	return os.RemoveAll(repoDir)
}

func (ps *PathService) getRemoteHeadHash() (plumbing.Hash, error) {
	rem := git.NewRemote(nil, &config.RemoteConfig{
		Name: "origin",
		URLs: []string{repoURL},
	})
	refs, err := rem.List(&git.ListOptions{})
	if err != nil {
		return plumbing.Hash{}, err
	}

	for _, ref := range refs {
		if ref.Name().IsBranch() && ref.Name().Short() == "main" {
			return ref.Hash(), nil
		}
	}
	return plumbing.Hash{}, fmt.Errorf("main branch not found")
}

func (ps *PathService) getLocalHeadHash() (plumbing.Hash, error) {
	repo, err := git.PlainOpen(repoDir)
	if err != nil {
		return plumbing.Hash{}, err
	}

	ref, err := repo.Head()
	if err != nil {
		return plumbing.Hash{}, err
	}
	return ref.Hash(), nil
}

func (ps *PathService) checkForUpdates(ctx context.Context, wg *sync.WaitGroup, logger *zap.SugaredLogger) {

	wg.Add(1)
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	startTime := time.Now()
	for {
		select {
		case <-ctx.Done():
			ps.logger.Infof("Shutting down the repo syncer...")
			wg.Done()
			return
		case t := <-ticker.C:
			if time.Since(startTime) < checkInterval {
				continue
			}
			startTime = t
			logger.Debugf("Syncing with upstream taxonomy repository...")
			remoteHash, err := ps.getRemoteHeadHash()
			if err != nil {
				logger.Errorf("Failed to get remote head hash: %v", err)
				continue
			}

			localHash, err := ps.getLocalHeadHash()
			if err != nil {
				logger.Errorf("Failed to get local head hash: %v", err)
				continue
			}

			if remoteHash != localHash {
				logger.Infof("New changes detected, updating repository...")
				err = ps.deleteRepo()
				if err != nil {
					logger.Errorf("Failed to delete repository: %v", err)
					continue
				}

				err = ps.cloneRepo()
				if err != nil {
					logger.Errorf("Failed to clone repository: %v", err)
					continue
				}

				logger.Infof("Repository updated successfully.")
			} else {
				logger.Debugf("No new changes detected.")
			}
		}

	}

}

func (ps *PathService) skillPathHandler(w http.ResponseWriter, r *http.Request) {
	dirName := r.URL.Query().Get("dir_name")

	var subDirs []string
	var levelOne bool
	if dirName == "" {
		levelOne = true
	}

	dirPath := filepath.Join(repoDir, dirName)
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		http.Error(w, "Directory path doesn't exist", http.StatusInternalServerError)
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			// If we are at root level, then only return directories ending with skills
			if levelOne && !strings.HasSuffix(entry.Name(), "skills") {
				continue
			}
			subDirs = append(subDirs, entry.Name())
		}
	}
	response, err := json.Marshal(subDirs)
	if err != nil {
		http.Error(w, "Error creating response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write(response)
}

func (ps *PathService) knowledgePathHandler(w http.ResponseWriter, r *http.Request) {
	dirName := r.URL.Query().Get("dir_name")

	// Knowledge taxonomy tree is present in the knowledge directory
	dirName = KNOWLEDGE + dirName
	var subDirs []string
	dirPath := filepath.Join(repoDir, dirName)
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		http.Error(w, "Directory path doesn't exist", http.StatusInternalServerError)
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			subDirs = append(subDirs, entry.Name())
		}
	}

	response, err := json.Marshal(subDirs)
	if err != nil {
		http.Error(w, "Error creating response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write(response)
}

func (ps *PathService) Start() {
	ctx, cancel := signal.NotifyContext(ps.ctx, syscall.SIGTERM, syscall.SIGQUIT, syscall.SIGINT)
	defer cancel()
	wg := &sync.WaitGroup{}
	ps.wg = wg

	// Clone the repository
	err := ps.cloneRepo()
	if err != nil {
		ps.logger.Errorf("Failed to clone the repository: %v", err)
	}

	// Start periodic update check in a separate goroutine
	go ps.checkForUpdates(ctx, wg, ps.logger)

	// Setup HTTP server
	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/tree/skills", ps.skillPathHandler)
	httpMux.HandleFunc("/tree/knowledge", ps.knowledgePathHandler)
	httpServer := &http.Server{
		Addr:        ":4000",
		Handler:     httpMux,
		ErrorLog:    log.Default(),
		ReadTimeout: 30 * time.Second,
		// Crank up WriteTimeout a bit more than usually
		// necessary just so we can do long CPU profiles
		// and not hit net/http/pprof's "profile
		// duration exceeds server's WriteTimeout".
		WriteTimeout: 5 * time.Minute,
	}
	ps.httpServer = httpServer

	wg.Add(1)
	defer wg.Done()
	ps.logger.Infof("Server listening on port %s", httpServer.Addr)
	err = httpServer.ListenAndServe()
	if err != nil {
		if err != http.ErrServerClosed {
			ps.logger.Fatalf("Failed to start http service %v", err)
		}
	}
	<-ctx.Done()
}

func (ps *PathService) Stop() {
	if ps.httpServer != nil {
		ps.wg.Add(1)
		defer ps.wg.Done()
		shutdownHttpCtx, _ := context.WithTimeout(ps.ctx, 1*time.Second)
		err := ps.httpServer.Shutdown(shutdownHttpCtx)
		if err != nil {
			ps.logger.Errorf("Failed to shutdown http server: %v", err)
			return
		}
		ps.logger.Infof("Http server stopped successfully")
	}
}

func (ps *PathService) WaitForGracefulShutdown() {
	ps.wg.Wait()
	ps.logger.Infof("Path service stopped successfully")
}

func Execute() {
	debug := os.Getenv(serviceLogLevel)
	var logger *zap.Logger
	var err error
	if debug != "" {
		logCfg := zap.NewDevelopmentConfig()
		logger, err = logCfg.Build()
		logger.Info("Debug logging enabled")
	} else {
		logCfg := zap.NewProductionConfig()
		logCfg.DisableStacktrace = true
		logCfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		logger, err = logCfg.Build()
	}
	if err != nil {
		logger.Fatal(err.Error())
	}

	var rootCmd = &cobra.Command{
		Use:   "pathservice",
		Short: "Path service for taxonomy tree",
		Run: func(cmd *cobra.Command, args []string) {
			pathService := NewPathService(cmd.Context(), logger.Sugar())

			sigchan := make(chan os.Signal, 1)
			signal.Notify(
				sigchan,
				syscall.SIGINT,
				syscall.SIGTERM,
				syscall.SIGQUIT,
			)
			go func(pathService *PathService) {
				<-sigchan
				pathService.Stop()
			}(pathService)

			pathService.Start()
			pathService.WaitForGracefulShutdown()
		},
	}

	rootCmd.PersistentFlags().StringP("version", "v", "1.0.0", "Version of the taxonomy path service")

	if err := rootCmd.Execute(); err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
}
