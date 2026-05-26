use std::fs;
use std::path::PathBuf;

use globset::Glob;

use crate::types::{FileInfo, FileTreeResult, FileContentResult, FileContentData, OperationResult};

const WORKSPACE_ROOT: &str = "/workspace";
const MAX_DEPTH: usize = 20;

/// Validates that the path is within the allowed workspace directory
fn validate_path(path: &str) -> Result<PathBuf, String> {
    let requested_path = PathBuf::from(path);
    
    // Normalize the path and resolve to absolute path
    let canonical_path = requested_path.canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;
    
    let workspace_root = PathBuf::from(WORKSPACE_ROOT).canonicalize()
        .map_err(|e| format!("Workspace root not accessible: {}", e))?;
    
    // Ensure the path is within workspace root
    if !canonical_path.starts_with(&workspace_root) {
        return Err("Access denied: Path outside workspace".to_string());
    }
    
    Ok(canonical_path)
}

fn is_ignored(_name: &str, _ignore_patterns: &[Glob]) -> bool {
    // TODO: Implement proper gitignore pattern matching
    // For now, skip gitignore processing to avoid API compatibility issues
    false
}

fn parse_gitignore(_path: &PathBuf) -> Vec<Glob> {
    // TODO: Implement proper gitignore parsing with correct glob API
    Vec::new()
}

fn get_file_info(
    path: &PathBuf,
    depth: usize,
    root_path: &PathBuf,
    _ignore_patterns: &[Glob],
) -> Option<FileInfo> {
    // Prevent excessive recursion
    if depth == 0 {
        return None;
    }
    
    let file_type = match fs::symlink_metadata(path) {
        Ok(md) => md.file_type(),
        Err(_) => return None,
    };

    let name = path.file_name()?.to_string_lossy().to_string();
    let full_path = path.to_string_lossy().to_string();

    let file_info = if file_type.is_dir() {
        let mut children = Vec::new();
        
        let ignore_patterns = parse_gitignore(path);
        
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                let entry_name = entry_path.file_name()?.to_string_lossy().to_string();
                
                // Skip hidden files (except . and ..)
                if entry_name.starts_with('.') && entry_name != "." && entry_name != ".." {
                    continue;
                }
                
                if is_ignored(&entry_name, &ignore_patterns) {
                    continue;
                }
                
                if let Some(child_info) = get_file_info(&entry_path, depth - 1, root_path, &ignore_patterns) {
                    children.push(child_info);
                }
            }
        }
        
        children.sort_by(|a, b| {
            let a_is_dir = a.r#type == "directory";
            let b_is_dir = b.r#type == "directory";
            match (a_is_dir, b_is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            }
        });
        
        FileInfo {
            name,
            path: full_path,
            r#type: "directory".to_string(),
            size: None,
            last_modified: None,
            children: Some(children),
        }
    } else {
        let metadata = fs::metadata(path).ok();
        
        // Format last modified time
        let last_modified = metadata.as_ref().and_then(|m| {
            m.modified().ok().and_then(|t| {
                // Convert SystemTime to RFC3339 string manually
                let duration_since_epoch = t.duration_since(std::time::UNIX_EPOCH).ok()?;
                let secs = duration_since_epoch.as_secs();
                // Simple RFC3339 format: 2024-01-01T00:00:00Z
                let datetime = chrono::DateTime::from_timestamp(secs as i64, 0)?;
                Some(datetime.to_rfc3339())
            })
        });
        
        let size = metadata.as_ref().map(|m| m.len());
        
        FileInfo {
            name,
            path: full_path,
            r#type: "file".to_string(),
            size,
            last_modified,
            children: None,
        }
    };

    Some(file_info)
}

pub fn get_file_tree(path_str: String, depth: i32) -> String {
    // Validate path to prevent traversal attacks
    match validate_path(&path_str) {
        Ok(valid_path) => {
            let root_path = if valid_path.is_dir() { 
                valid_path.clone() 
            } else { 
                valid_path.parent().unwrap().to_path_buf() 
            };
            
            let ignore_patterns = parse_gitignore(&root_path);
            let safe_depth = std::cmp::min(depth as usize, MAX_DEPTH);
            
            match get_file_info(&valid_path, safe_depth, &root_path, &ignore_patterns) {
                Some(data) => {
                    let result = FileTreeResult {
                        status: "success".to_string(),
                        data: Some(data),
                        message: None,
                    };
                    serde_json::to_string(&result).unwrap()
                }
                None => {
                    let result = FileTreeResult {
                        status: "error".to_string(),
                        data: None,
                        message: Some("Failed to read directory".to_string()),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        Err(e) => {
            let result = FileTreeResult {
                status: "error".to_string(),
                data: None,
                message: Some(e),
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn read_file(path_str: String) -> String {
    match validate_path(&path_str) {
        Ok(valid_path) => {
            match fs::read_to_string(&valid_path) {
                Ok(content) => {
                    let result = FileContentResult {
                        status: "success".to_string(),
                        data: Some(FileContentData {
                            path: path_str,
                            content,
                        }),
                        message: None,
                    };
                    serde_json::to_string(&result).unwrap()
                }
                Err(e) => {
                    let result = FileContentResult {
                        status: "error".to_string(),
                        data: None,
                        message: Some(e.to_string()),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        Err(e) => {
            let result = FileContentResult {
                status: "error".to_string(),
                data: None,
                message: Some(e),
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn write_file(path_str: String, content: String) -> String {
    match validate_path(&path_str) {
        Ok(valid_path) => {
            match fs::write(&valid_path, content) {
                Ok(_) => {
                    let result = OperationResult {
                        status: "success".to_string(),
                        message: "File written successfully".to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
                Err(e) => {
                    let result = OperationResult {
                        status: "error".to_string(),
                        message: e.to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        Err(e) => {
            let result = OperationResult {
                status: "error".to_string(),
                message: e,
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn create_file(path_str: String) -> String {
    match validate_path(&path_str) {
        Ok(valid_path) => {
            match fs::File::create(&valid_path) {
                Ok(_) => {
                    let result = OperationResult {
                        status: "success".to_string(),
                        message: "File created successfully".to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
                Err(e) => {
                    let result = OperationResult {
                        status: "error".to_string(),
                        message: e.to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        Err(e) => {
            let result = OperationResult {
                status: "error".to_string(),
                message: e,
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn create_directory(path_str: String) -> String {
    match validate_path(&path_str) {
        Ok(valid_path) => {
            match fs::create_dir_all(&valid_path) {
                Ok(_) => {
                    let result = OperationResult {
                        status: "success".to_string(),
                        message: "Directory created successfully".to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
                Err(e) => {
                    let result = OperationResult {
                        status: "error".to_string(),
                        message: e.to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        Err(e) => {
            let result = OperationResult {
                status: "error".to_string(),
                message: e,
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn rename_file(old_path_str: String, new_path_str: String) -> String {
    match (validate_path(&old_path_str), validate_path(&new_path_str)) {
        (Ok(old_path), Ok(new_path)) => {
            match fs::rename(&old_path, &new_path) {
                Ok(_) => {
                    let result = OperationResult {
                        status: "success".to_string(),
                        message: "File renamed successfully".to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
                Err(e) => {
                    let result = OperationResult {
                        status: "error".to_string(),
                        message: e.to_string(),
                    };
                    serde_json::to_string(&result).unwrap()
                }
            }
        }
        (Err(e), _) | (_, Err(e)) => {
            let result = OperationResult {
                status: "error".to_string(),
                message: e,
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}

pub fn delete_file(path_str: String) -> String {
    match validate_path(&path_str) {
        Ok(valid_path) => {
            if valid_path.is_dir() {
                match fs::remove_dir_all(&valid_path) {
                    Ok(_) => {
                        let result = OperationResult {
                            status: "success".to_string(),
                            message: "Directory deleted successfully".to_string(),
                        };
                        serde_json::to_string(&result).unwrap()
                    }
                    Err(e) => {
                        let result = OperationResult {
                            status: "error".to_string(),
                            message: e.to_string(),
                        };
                        serde_json::to_string(&result).unwrap()
                    }
                }
            } else {
                match fs::remove_file(&valid_path) {
                    Ok(_) => {
                        let result = OperationResult {
                            status: "success".to_string(),
                            message: "File deleted successfully".to_string(),
                        };
                        serde_json::to_string(&result).unwrap()
                    }
                    Err(e) => {
                        let result = OperationResult {
                            status: "error".to_string(),
                            message: e.to_string(),
                        };
                        serde_json::to_string(&result).unwrap()
                    }
                }
            }
        }
        Err(e) => {
            let result = OperationResult {
                status: "error".to_string(),
                message: e,
            };
            serde_json::to_string(&result).unwrap()
        }
    }
}