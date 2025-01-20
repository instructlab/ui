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
// and returns the path of the latest modified file. Returns an error if none is found.
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
