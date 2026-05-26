use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub r#type: String,
    pub size: Option<u64>,
    pub last_modified: Option<String>,
    pub children: Option<Vec<FileInfo>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileTreeResult {
    pub status: String,
    pub data: Option<FileInfo>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileContentResult {
    pub status: String,
    pub data: Option<FileContentData>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileContentData {
    pub path: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OperationResult {
    pub status: String,
    pub message: String,
}