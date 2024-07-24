package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
	"gopkg.in/src-d/go-git.v4/config"
)

const (
	repoURL = "https://github.com/instructlab/taxonomy"
	repoDir = "./taxonomy"
	checkInterval = 1 * time.Minute // Interval for checking updates
	SKILLS = "skills/"
	KNOWLEDGE = "knowledge/"
)

func cloneRepo() error {
	// check if the repo directory exists
	if _, err := os.Stat(repoDir); err == nil {
		log.Printf("Repository already exists at %s, skip cloning", repoDir)
		return nil
	}
	_, err := git.PlainClone(repoDir, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})
	return err
}

func deleteRepo() error {
	return os.RemoveAll(repoDir)
}

func getRemoteHeadHash() (plumbing.Hash, error) {
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

func getLocalHeadHash() (plumbing.Hash, error) {
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

func checkForUpdates() {
	for {
		time.Sleep(checkInterval)

		remoteHash, err := getRemoteHeadHash()
		if err != nil {
			log.Printf("Failed to get remote head hash: %v", err)
			continue
		}

		localHash, err := getLocalHeadHash()
		if err != nil {
			log.Printf("Failed to get local head hash: %v", err)
			continue
		}

		if remoteHash != localHash {
			log.Println("New changes detected, updating repository...")
			err = deleteRepo()
			if err != nil {
				log.Printf("Failed to delete repository: %v", err)
				continue
			}

			err = cloneRepo()
			if err != nil {
				log.Printf("Failed to clone repository: %v", err)
				continue
			}

			log.Println("Repository updated successfully.")
		}
	}
}

func skillPathHandler(w http.ResponseWriter, r *http.Request) {
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

func knowledgePathHandler(w http.ResponseWriter, r *http.Request) {
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

func main() {
	// Clone the repository
	err := cloneRepo()
	if err != nil {
		log.Fatalf("Failed to clone the repository: %v", err)
	}

	// Start periodic update check in a separate goroutine
	go checkForUpdates()

	// Setup HTTP server
	http.HandleFunc("/tree/skills", skillPathHandler)
	http.HandleFunc("/tree/knowledge", knowledgePathHandler)

	port := ":4000"
	fmt.Printf("Server listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
