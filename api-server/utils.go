package main

import (
  "fmt"
  "io"
  "io/ioutil"
  "os"
  "path/filepath"
  "strings"
)

// findLatestFileWithPrefix scans `dir` for all files whose name starts with `prefix`,
// and returns the path of the latest modified file.
func findLatestFileWithPrefix(dir, prefix string) (string, error) {
  files, err := ioutil.ReadDir(dir)
  if err != nil {
    return "", fmt.Errorf("failed to read directory '%s': %v", dir, err)
  }

  var latestFile os.FileInfo
  for _, f := range files {
    if strings.HasPrefix(f.Name(), prefix) && strings.HasSuffix(f.Name(), ".jsonl") {
      if latestFile == nil || f.ModTime().After(latestFile.ModTime()) {
        latestFile = f
      }
    }
  }
  if latestFile == nil {
    return "", fmt.Errorf("no file found matching prefix '%s' in '%s'", prefix, dir)
  }
  return filepath.Join(dir, latestFile.Name()), nil
}

// overwriteCopy removes `destPath` if it exists, then copies srcPath -> destPath.
func overwriteCopy(srcPath, destPath string) error {
  // If the destination file already exists, remove it
  if _, err := os.Stat(destPath); err == nil {
    if err := os.Remove(destPath); err != nil {
      return fmt.Errorf("could not remove existing file '%s': %v", destPath, err)
    }
  }

  // Open the source
  in, err := os.Open(srcPath)
  if err != nil {
    return fmt.Errorf("could not open source file '%s': %v", srcPath, err)
  }
  defer in.Close()

  // Create the destination
  out, err := os.Create(destPath)
  if err != nil {
    return fmt.Errorf("could not create dest file '%s': %v", destPath, err)
  }
  defer out.Close()

  // Copy contents
  if _, err := io.Copy(out, in); err != nil {
    return fmt.Errorf("failed to copy '%s' to '%s': %v", srcPath, destPath, err)
  }

  return nil
}

// getBaseCacheDir returns the base cache directory path: ~/.cache/instructlab/
func getBaseCacheDir() (string, error) {
  homeDir, err := os.UserHomeDir()
  if err != nil {
    return "", fmt.Errorf("failed to get user home directory: %v", err)
  }
  return filepath.Join(homeDir, ".cache", "instructlab"), nil
}

// getFullModelPath converts a user-supplied model name into a fully qualified path:
//
//	~/.cache/instructlab/models/<modelName>
func getFullModelPath(modelName string) (string, error) {
  baseCacheDir, err := getBaseCacheDir()
  if err != nil {
    return "", err
  }
  // If user-supplied name already starts with "models/", don't prepend again
  if strings.HasPrefix(modelName, "models/") {
    return filepath.Join(baseCacheDir, modelName), nil
  }
  return filepath.Join(baseCacheDir, "models", modelName), nil
}

// findLatestDirWithPrefix finds the most recently modified directory within 'dir' that starts with 'prefix'.
func (srv *ILabServer) findLatestDirWithPrefix(dir, prefix string) (string, error) {
  entries, err := ioutil.ReadDir(dir)
  if err != nil {
    return "", fmt.Errorf("failed to read directory '%s': %v", dir, err)
  }

  var latestDir os.FileInfo
  for _, entry := range entries {
    if !entry.IsDir() {
      continue
    }
    if strings.HasPrefix(entry.Name(), prefix) {
      if latestDir == nil || entry.ModTime().After(latestDir.ModTime()) {
        latestDir = entry
      }
    }
  }

  if latestDir == nil {
    return "", fmt.Errorf("no directory found in '%s' with prefix '%s'", dir, prefix)
  }

  latestPath := filepath.Join(dir, latestDir.Name())
  return latestPath, nil
}

// getLatestDatasetFile returns the path to the latest dataset file named "knowledge_train_msgs_*.jsonl".
func (srv *ILabServer) getLatestDatasetFile() (string, error) {
  homeDir, err := os.UserHomeDir()
  if err != nil {
    return "", fmt.Errorf("failed to get user home directory: %v", err)
  }
  datasetDir := filepath.Join(homeDir, ".local", "share", "instructlab", "datasets")
  files, err := ioutil.ReadDir(datasetDir)
  if err != nil {
    return "", fmt.Errorf("failed to read dataset directory: %v", err)
  }

  var latestFile os.FileInfo
  for _, file := range files {
    if strings.HasPrefix(file.Name(), "knowledge_train_msgs_") && strings.HasSuffix(file.Name(), ".jsonl") {
      if latestFile == nil || file.ModTime().After(latestFile.ModTime()) {
        latestFile = file
      }
    }
  }
  if latestFile == nil {
    return "", fmt.Errorf("no dataset file found with the prefix 'knowledge_train_msgs_'")
  }
  return filepath.Join(datasetDir, latestFile.Name()), nil
}
