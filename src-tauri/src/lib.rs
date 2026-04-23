// ============================================================
// 金钥匙 - Tauri 后端 (Rust)
// ============================================================

use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

// ============================================================
// 数据模型
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentBlock {
    pub id: String,
    pub lang: String,
    #[serde(rename = "type")]
    pub block_type: String,
    pub content: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImage {
    pub id: String,
    pub url: String,
    pub is_primary: bool,
    pub alt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: String,
    pub num_iid: String,
    pub category_id: String,
    pub category_name: String,
    pub title_zh: String,
    pub title_en: String,
    pub guide_title: String,
    pub sku_search_title: String,
    pub description_zh: String,
    pub description_en: String,
    pub cost_price: f64,
    pub logistics_cost: f64,
    pub packaging_cost: f64,
    pub platform_commission: f64,
    pub selling_price: Option<f64>,
    pub merchant_code: String,
    pub size_spec: String,
    pub taobao_link: String,
    pub sku_info: Vec<SkuItem>,
    pub images: Vec<ProductImage>,
    pub content_blocks: Vec<ContentBlock>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkuItem {
    pub sku_id: String,
    pub brand: String,       // 品牌
    pub item_no: String,     // 货号
    pub origin: String,       // 产地
    pub washable: bool,      // 是否可拆洗
    pub sales_attr: String,  // 销售属性
    pub attr_pair: String,    // 属性对
    pub attributes: String,   // 颜色分类
    pub pattern: String,      // 图案
    pub size: String,         // 尺寸
    pub price: Option<f64>,
    pub stock: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductInput {
    pub num_iid: String,
    pub category_id: String,
    pub category_name: String,
    pub title_zh: String,
    pub title_en: String,
    pub guide_title: String,
    pub sku_search_title: String,
    pub description_zh: String,
    pub description_en: String,
    pub cost_price: f64,
    pub logistics_cost: f64,
    pub packaging_cost: f64,
    pub platform_commission: f64,
    pub selling_price: Option<f64>,
    pub merchant_code: String,
    pub size_spec: String,
    pub taobao_link: String,
    pub sku_info: Vec<SkuItem>,
    pub images: Vec<ProductImage>,
    pub content_blocks: Vec<ContentBlock>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AITitleResult {
    pub title_zh: String,
    pub title_en: String,
    pub guide_title: String,
    pub sku_search_title: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIPriceResult {
    pub suggested_price: f64,
    pub profit: f64,
    pub profit_rate: f64,
    pub reason: String,
}

// ============================================================
// 数据库
// ============================================================

pub struct DbConn(pub Mutex<Connection>);

fn init_db(conn: &Connection) -> SqlResult<()> {
    // 检查 products 表是否存在及列数
    let table_exists: bool = conn
        .query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='products'",
            rusqlite::params![],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0) > 0;

    if !table_exists {
        // 首次运行，直接创建新表
        conn.execute(
            "CREATE TABLE products (
                id TEXT PRIMARY KEY,
                num_iid TEXT NOT NULL DEFAULT '',
                category_id TEXT NOT NULL DEFAULT '',
                category_name TEXT NOT NULL DEFAULT '',
                title_zh TEXT NOT NULL DEFAULT '',
                title_en TEXT NOT NULL DEFAULT '',
                guide_title TEXT NOT NULL DEFAULT '',
                description_zh TEXT NOT NULL DEFAULT '',
                description_en TEXT NOT NULL DEFAULT '',
                cost_price REAL NOT NULL DEFAULT 0,
                logistics_cost REAL NOT NULL DEFAULT 0,
                packaging_cost REAL NOT NULL DEFAULT 0,
                platform_commission REAL NOT NULL DEFAULT 0,
                selling_price REAL,
                merchant_code TEXT NOT NULL DEFAULT '',
                size_spec TEXT NOT NULL DEFAULT '',
                images TEXT NOT NULL DEFAULT '[]',
                content_blocks TEXT NOT NULL DEFAULT '[]',
                tags TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            rusqlite::params![],
        )?;
        return Ok(());
    }

    // 检查并添加缺失的列 (数据库迁移)
    let columns: Vec<String> = conn
        .prepare("PRAGMA table_info(products)")?
        .query_map(rusqlite::params![], |row| row.get(1))?
        .collect::<Result<Vec<String>, _>>()?;

    if !columns.contains(&"size_spec".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN size_spec TEXT NOT NULL DEFAULT ''", rusqlite::params![])?;
    }
    if !columns.contains(&"merchant_code".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN merchant_code TEXT NOT NULL DEFAULT ''", rusqlite::params![])?;
    }
    if !columns.contains(&"selling_price".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN selling_price REAL", rusqlite::params![])?;
    }
    if !columns.contains(&"images".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'", rusqlite::params![])?;
    }
    if !columns.contains(&"content_blocks".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN content_blocks TEXT NOT NULL DEFAULT '[]'", rusqlite::params![])?;
    }
    if !columns.contains(&"tags".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'", rusqlite::params![])?;
    }
    if !columns.contains(&"guide_title".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN guide_title TEXT NOT NULL DEFAULT ''", rusqlite::params![])?;
    }
    if !columns.contains(&"sku_search_title".to_string()) {
        conn.execute("ALTER TABLE products ADD COLUMN sku_search_title TEXT NOT NULL DEFAULT ''", rusqlite::params![])?;
    }

    Ok(())
}

#[tauri::command]
fn get_all_products(state: State<DbConn>) -> Result<Vec<Product>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, num_iid, category_id, category_name, title_zh, title_en, guide_title, sku_search_title, description_zh, description_en, cost_price, logistics_cost, packaging_cost, platform_commission, selling_price, merchant_code, size_spec, taobao_link, sku_info, images, content_blocks, tags, created_at, updated_at FROM products ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![], |row| {
            let images_json: String = row.get(19)?;
            let blocks_json: String = row.get(20)?;
            let tags_json: String = row.get(21)?;
            let sku_info_json: String = row.get(18)?;
            Ok(Product {
                id: row.get(0)?,
                num_iid: row.get(1)?,
                category_id: row.get(2)?,
                category_name: row.get(3)?,
                title_zh: row.get(4)?,
                title_en: row.get(5)?,
                guide_title: row.get(6)?,
                sku_search_title: row.get(7)?,
                description_zh: row.get(8)?,
                description_en: row.get(9)?,
                cost_price: row.get(10)?,
                logistics_cost: row.get(11)?,
                packaging_cost: row.get(12)?,
                platform_commission: row.get(13)?,
                selling_price: row.get(14)?,
                merchant_code: row.get(15)?,
                size_spec: row.get(16)?,
                taobao_link: row.get(17)?,
                sku_info: serde_json::from_str(&sku_info_json).unwrap_or_default(),
                images: serde_json::from_str(&images_json).unwrap_or_default(),
                content_blocks: serde_json::from_str(&blocks_json).unwrap_or_default(),
                tags: serde_json::from_str(&tags_json).unwrap_or_default(),
                created_at: row.get(22)?,
                updated_at: row.get(23)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let products: Vec<Product> = rows.filter_map(|r| r.ok()).collect();
    Ok(products)
}

#[tauri::command]
fn get_product(id: String, state: State<DbConn>) -> Result<Product, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, num_iid, category_id, category_name, title_zh, title_en, guide_title, sku_search_title, description_zh, description_en, cost_price, logistics_cost, packaging_cost, platform_commission, selling_price, merchant_code, size_spec, taobao_link, sku_info, images, content_blocks, tags, created_at, updated_at FROM products WHERE id = ?")
        .map_err(|e| e.to_string())?;

    let product = stmt.query_row(rusqlite::params![id], |row| {
        let images_json: String = row.get(19)?;
        let blocks_json: String = row.get(20)?;
        let tags_json: String = row.get(21)?;
        let sku_info_json: String = row.get(18)?;
        Ok(Product {
            id: row.get(0)?,
            num_iid: row.get(1)?,
            category_id: row.get(2)?,
            category_name: row.get(3)?,
            title_zh: row.get(4)?,
            title_en: row.get(5)?,
            guide_title: row.get(6)?,
            sku_search_title: row.get(7)?,
            description_zh: row.get(8)?,
            description_en: row.get(9)?,
            cost_price: row.get(10)?,
            logistics_cost: row.get(11)?,
            packaging_cost: row.get(12)?,
            platform_commission: row.get(13)?,
            selling_price: row.get(14)?,
            merchant_code: row.get(15)?,
            size_spec: row.get(16)?,
            taobao_link: row.get(17)?,
            sku_info: serde_json::from_str(&sku_info_json).unwrap_or_default(),
            images: serde_json::from_str(&images_json).unwrap_or_default(),
            content_blocks: serde_json::from_str(&blocks_json).unwrap_or_default(),
            tags: serde_json::from_str(&tags_json).unwrap_or_default(),
            created_at: row.get(22)?,
            updated_at: row.get(23)?,
        })
    }).map_err(|e| e.to_string())?;
    Ok(product)
}

#[tauri::command]
fn create_product(data: ProductInput, state: State<DbConn>) -> Result<Product, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let images_json = serde_json::to_string(&data.images).unwrap_or_else(|_| "[]".to_string());
    let blocks_json = serde_json::to_string(&data.content_blocks).unwrap_or_else(|_| "[]".to_string());
    let tags_json = serde_json::to_string(&data.tags).unwrap_or_else(|_| "[]".to_string());
    let sku_info_json = serde_json::to_string(&data.sku_info).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO products (id, num_iid, category_id, category_name, title_zh, title_en, guide_title, sku_search_title, description_zh, description_en, cost_price, logistics_cost, packaging_cost, platform_commission, selling_price, merchant_code, size_spec, taobao_link, sku_info, images, content_blocks, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
            id,
            data.num_iid,
            data.category_id,
            data.category_name,
            data.title_zh,
            data.title_en,
            data.guide_title,
            data.sku_search_title,
            data.description_zh,
            data.description_en,
            data.cost_price,
            data.logistics_cost,
            data.packaging_cost,
            data.platform_commission,
            data.selling_price,
            data.merchant_code,
            data.size_spec,
            data.taobao_link,
            sku_info_json,
            images_json,
            blocks_json,
            tags_json,
            now,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(Product {
        id,
        num_iid: data.num_iid,
        category_id: data.category_id,
        category_name: data.category_name,
        title_zh: data.title_zh,
        title_en: data.title_en,
        guide_title: data.guide_title,
        sku_search_title: data.sku_search_title,
        description_zh: data.description_zh,
        description_en: data.description_en,
        cost_price: data.cost_price,
        logistics_cost: data.logistics_cost,
        packaging_cost: data.packaging_cost,
        platform_commission: data.platform_commission,
        selling_price: data.selling_price,
        merchant_code: data.merchant_code,
        size_spec: data.size_spec,
        taobao_link: data.taobao_link,
        sku_info: data.sku_info,
        images: data.images,
        content_blocks: data.content_blocks,
        tags: data.tags,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
fn update_product(product: Product, state: State<DbConn>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();

    let images_json = serde_json::to_string(&product.images).unwrap_or_else(|_| "[]".to_string());
    let blocks_json = serde_json::to_string(&product.content_blocks).unwrap_or_else(|_| "[]".to_string());
    let tags_json = serde_json::to_string(&product.tags).unwrap_or_else(|_| "[]".to_string());
    let sku_info_json = serde_json::to_string(&product.sku_info).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "UPDATE products SET num_iid = ?, category_id = ?, category_name = ?, title_zh = ?, title_en = ?, guide_title = ?, sku_search_title = ?, description_zh = ?, description_en = ?, cost_price = ?, logistics_cost = ?, packaging_cost = ?, platform_commission = ?, selling_price = ?, merchant_code = ?, size_spec = ?, taobao_link = ?, sku_info = ?, images = ?, content_blocks = ?, tags = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![
            product.num_iid,
            product.category_id,
            product.category_name,
            product.title_zh,
            product.title_en,
            product.guide_title,
            product.sku_search_title,
            product.description_zh,
            product.description_en,
            product.cost_price,
            product.logistics_cost,
            product.packaging_cost,
            product.platform_commission,
            product.selling_price,
            product.merchant_code,
            product.size_spec,
            product.taobao_link,
            sku_info_json,
            images_json,
            blocks_json,
            tags_json,
            now,
            product.id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_products(ids: Vec<String>, state: State<DbConn>) -> Result<usize, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut count = 0;
    for id in ids {
        tx.execute("DELETE FROM products WHERE id = ?", rusqlite::params![id])
            .map_err(|e| e.to_string())?;
        count += 1;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(count)
}

#[tauri::command]
fn delete_product(id: String, state: State<DbConn>) -> Result<bool, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM products WHERE id = ?", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(true)
}

// ============================================================
// AI Commands
// ============================================================

/// 清理 AI 响应：移除 <think> 块，提取第一个 JSON 对象
fn clean_ai_response(response: &str) -> String {
    // 1. 移除 DeepSeek 等模型的 <think>...</think> 思考块
    let mut cleaned = response.to_string();
    if let (Some(start), Some(end)) = (cleaned.find("<think>"), cleaned.find("</think>")) {
        if end > start {
            cleaned.drain(start..end + 8); // 8 is length of "</think>"
        }
    }
    let cleaned = cleaned.trim();

    // 2. 提取 JSON 内容块
    if let (Some(s), Some(e)) = (cleaned.find('{'), cleaned.rfind('}')) {
        cleaned[s..=e].to_string()
    } else {
        cleaned.to_string()
    }
}

fn call_ai_chat_raw(base_url: &str, api_key: &str, body: &serde_json::Value) -> Result<String, String> {
    let api_key = api_key.trim();
    let base_url = base_url.trim().trim_end_matches('/');
    if api_key.is_empty() { return Err("API Key 不能为空".to_string()); }
    if base_url.is_empty() { return Err("Base URL 不能为空".to_string()); }

    let url = if base_url.ends_with("/chat/completions") {
        base_url.to_string()
    } else {
        format!("{}/chat/completions", base_url)
    };

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("初始化客户端失败: {}", e))?;

    let mut last_err = String::new();
    for i in 0..2 {
        match client.post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send() {
                Ok(resp) => {
                    if !resp.status().is_success() {
                        let status = resp.status();
                        let text = resp.text().unwrap_or_default();
                        return Err(format!("API 返回错误 ({}): {}", status, text));
                    }
                    let json: serde_json::Value = resp.json().map_err(|e| format!("解析响应失败: {}", e))?;
                    let content = json["choices"][0]["message"]["content"]
                        .as_str()
                        .ok_or("响应格式错误，无法提取内容")?
                        .to_string();
                    return Ok(content);
                },
                Err(e) => {
                    last_err = format!("第 {} 次尝试失败: {}", i + 1, e);
                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
            }
    }
    Err(format!("网络请求最终失败: {}", last_err))
}

fn call_ai_chat(base_url: &str, api_key: &str, model: &str, prompt: &str) -> Result<String, String> {
    let body = serde_json::json!({
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一个专业的电商助手，直接返回结果，不要啰嗦。"},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "stream": false
    });
    call_ai_chat_raw(base_url, api_key, &body)
}

fn read_image_to_base64(path: &str) -> Result<String, String> {
    // 处理 URL 编码的路径 (如 %20 -> 空格)
    let decoded_path = urlencoding::decode(path).map_err(|_| "路径解码失败".to_string())?;
    let bytes = std::fs::read(&*decoded_path).map_err(|e| format!("读取图片失败 ({}): {}", decoded_path, e))?;
    Ok(BASE64.encode(bytes))
}

#[tauri::command]
fn ai_extract_size(images: Vec<ProductImage>, api_key: String, base_url: String, model: String) -> Result<String, String> {
    if images.is_empty() { return Err("没有可供分析的图片".to_string()); }
    
    let mut contents = Vec::new();
    contents.push(serde_json::json!({
        "type": "text",
        "text": "你是一个资深的电商产品规格专家。请分析提供的刺绣布贴图片，识别产品的尺寸规格。
重点关注图片中的卷尺、直尺或手写标注。
请直接返回尺寸数值（如：6cm x 6cm 或 75mm x 50mm），严禁包含任何多余的解释、前言或标点符号。
如果图片中完全没有尺寸线索，请返回 '未找到尺寸'。"
    }));

    for img in images {
        let url = img.url.clone();
        if url.starts_with("http") && !url.contains("asset.localhost") {
            contents.push(serde_json::json!({
                "type": "image_url",
                "image_url": { "url": url, "detail": "high" }
            }));
        } else {
            // 处理 Tauri v2 各种可能的资产协议前缀
            let path = url
                .trim_start_matches("asset://")
                .trim_start_matches("https://asset.localhost/")
                .trim_start_matches("http://asset.localhost/");
            
            match read_image_to_base64(path) {
                Ok(b64) => {
                    let mime = if path.to_lowercase().ends_with(".png") { "image/png" } 
                              else if path.to_lowercase().ends_with(".webp") { "image/webp" }
                              else { "image/jpeg" };
                    contents.push(serde_json::json!({
                        "type": "image_url",
                        "image_url": { 
                            "url": format!("data:{};base64,{}", mime, b64),
                            "detail": "high"
                        }
                    }));
                },
                Err(e) => {
                    println!("Warning: 忽略无法读取的图片: {}", e);
                }
            }
        }
    }

    let body = serde_json::json!({
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一个专业的电商视觉助手。"},
            {"role": "user", "content": contents}
        ],
        "max_tokens": 100
    });

    let res = call_ai_chat_raw(&base_url, &api_key, &body)?;
    Ok(clean_ai_response(&res).trim_matches('"').to_string())
}

#[tauri::command]
fn ai_generate_title(zh_input: String, en_input: String, info: String, api_key: String, base_url: String, model: String) -> Result<AITitleResult, String> {
    let prompt = format!(
        "请基于【2026 淘宝 SEO 正优化规则】优化以下刺绣布贴产品的标题。
要求：
1. 中文标题：淘宝搜索用，严格控制在 30 字以内。必须包含核心词（如：羽绒服破洞修补、修补无痕、补丁贴）、风格词（如：国潮、动漫、复古）及材质词。
2. 禁忌：严禁出现“免缝自粘”字样。严禁使用极限词（最、第一、唯一等）。
3. 导购标题：淘宝卖点展示，严格控制在 15 字以内。要求：具有营销力的 punchy 语，如“一烫即牢 拯救无趣包包”。
4. SKU/SKC搜索标题：淘宝精准引流，10-15 个汉字。核心词 + 具体的款式特征。
5. 关键词权重：将“羽绒服破洞修补”或“修补无痕”置于标题最前端。
6. IP 处理：允许并保留“宝可梦”、“鬼灭之刃”关键词；其他品牌采用描述性替代词以防侵权。
7. 英文标题：Etsy 用，<140 字符，精工细腻风格。

原中文：{}
原英文：{}
描述：{}

必须直接返回 JSON 格式（不要包含任何解释性文字或思考过程）：
{{
  \"title_zh\": \"...\",
  \"title_en\": \"...\",
  \"guide_title\": \"...\",
  \"sku_search_title\": \"...\",
  \"reason\": \"...\"
}}",
        zh_input, en_input, info
    );

    let response = call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    let json_str = clean_ai_response(&response);
    
    let mut zh = String::new();
    let mut en = String::new();
    let mut guide = String::new();
    let mut sku_search = String::new();
    let mut reason = String::new();

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
        zh = json["title_zh"].as_str().or(json["titleZh"].as_str()).unwrap_or("").to_string();
        en = json["title_en"].as_str().or(json["titleEn"].as_str()).unwrap_or("").to_string();
        guide = json["guide_title"].as_str().or(json["guideTitle"].as_str()).unwrap_or("").to_string();
        sku_search = json["sku_search_title"].as_str().or(json["skuSearchTitle"].as_str()).unwrap_or("").to_string();
        reason = json["reason"].as_str().unwrap_or("").to_string();
    }

    if zh.is_empty() { return Err(format!("AI 响应格式解析失败，请检查模型输出。")); }
    Ok(AITitleResult { title_zh: zh, title_en: en, guide_title: guide, sku_search_title: sku_search, reason })
}

#[tauri::command]
fn ai_generate_sku_title(title: String, desc: String, tags: Vec<String>, api_key: String, base_url: String, model: String) -> Result<String, String> {
    let prompt = format!(
        "请为以下刺绣布贴产品生成一个精准的【2026 淘宝 SKU/SKC 搜索标题】。
要求：
1. 长度严格控制在 10-15 个汉字之间。
2. 包含产品核心关键词（如：羽绒服破洞修补、修补无痕、补丁贴）。
3. 必须包含一个具体的款式特征。
4. 结构：[核心词] + [SKU 款式特征]。
5. 严禁出现“免缝自粘”字样。严禁包含“最、第一、包邮”等违禁词。
6. 允许保留“宝可梦”、“鬼灭之刃”品牌名。

产品名称：{}
描述：{}
标签：{}

直接返回 SKU 搜索标题内容，不要有任何多余文字、引号或解释。",
        title, desc, tags.join(", ")
    );

    let response = call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    Ok(clean_ai_response(&response).trim_matches('"').to_string())
}

#[tauri::command]
fn ai_generate_guide_title(title: String, desc: String, tags: Vec<String>, api_key: String, base_url: String, model: String) -> Result<String, String> {
    let prompt = format!(
        "请为以下刺绣布贴产品生成一个吸引人的【2026 淘宝导购标题】。
要求：
1. 长度严格控制在 15 个汉字以内。
2. 突出核心卖点（如：一烫即牢、精工刺绣、修补无痕、拯救羽绒服等）。
3. 语气要轻快、具有营销力。
4. 严禁出现“免缝自粘”字样。严禁包含“最、第一”等违禁词。

产品名称：{}
描述：{}
标签：{}

直接返回导购标题内容，不要有任何多余文字、引号或解释。",
        title, desc, tags.join(", ")
    );

    let response = call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    Ok(clean_ai_response(&response).trim_matches('"').to_string())
}

#[tauri::command]
fn ai_suggest_price(cost: f64, info: String, api_key: String, base_url: String, model: String) -> Result<AIPriceResult, String> {
    let prompt = format!(
        "作为电商定价专家，请为以下刺绣布贴产品推荐销售价格。
成本价：{} 元
产品信息：{}

要求：
1. 考虑 30%-60% 的合理利润率。
2. 考虑电商平台的佣金（约 10%）和物流成本。
3. 给出详细的定价理由。

必须直接返回 JSON 格式（不要包含任何解释性文字或思考过程）：
{{
  \"suggested_price\": 0.0,
  \"profit\": 0.0,
  \"profit_rate\": 0.0,
  \"reason\": \"...\"
}}",
        cost, info
    );

    let response = call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    let json_str = clean_ai_response(&response);
    
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
        let suggested_price = json["suggested_price"].as_f64().or_else(|| json["suggestedPrice"].as_f64()).unwrap_or(cost * 3.0);
        let profit = json["profit"].as_f64().or_else(|| json["profitAmount"].as_f64()).unwrap_or(suggested_price - cost);
        let profit_rate = json["profit_rate"].as_f64().or_else(|| json["profitRate"].as_f64()).unwrap_or(60.0);
        let reason = json["reason"].as_str().unwrap_or("").to_string();
        
        Ok(AIPriceResult {
            suggested_price,
            profit,
            profit_rate,
            reason,
        })
    } else {
        Ok(AIPriceResult {
            suggested_price: cost * 3.0,
            profit: cost * 2.0,
            profit_rate: 66.7,
            reason: format!("AI 解析失败，使用默认建议值。原始输出: {}", response),
        })
    }
}

#[tauri::command]
fn ai_generate_description(product: ProductInput, lang: String, api_key: String, base_url: String, model: String) -> Result<serde_json::Value, String> {
    let en_style_guide = "
Structure and Guidelines (Etsy Boutique Style):
- Hook: 1-2 sentences. Enthusiastic opening.
- Size: [SizeSpec] (If empty, estimate from info, e.g. 'Approximately 55mm x 55mm').
- ✨ FEATURES ✨: 3-5 high-impact points highlighting quality and design.
- 💖 PERFECT FOR 💖: 3-5 creative uses (e.g., jackets, bags, gifts).
- 💫 ABOUT THE CHARACTER/THEME 💫: (ONLY if the patch features a recognizable character from Anime, Manga, Cartoons, or Pop Culture e.g., Pokémon, Disney, Ghibli, Sanrio, Marvel. Provide 2-3 sentences of charming lore, character traits, or their role in their universe to build an emotional connection. If it's a generic design like a flower, skull, or simple pattern, OMIT this section entirely).
- 🎀 HOW TO APPLY (IRON-ON) 🎀: Use these EXACT steps:
   1. Pre-wash and dry your garment without fabric softener
   2. Place the patch on the desired location, adhesive side down
   3. Cover with a thin cloth or parchment paper
   4. Press a hot iron (no steam) firmly for 30-45 seconds
   5. Allow to cool completely, then press from the inside for extra hold
   6. For best results, sew around the edges after ironing

IMPORTANT FORMATTING RULES:
- DO NOT use HTML tags. Use PLAIN TEXT ONLY.
- Use DOUBLE NEWLINE characters (\\n\\n) between EVERY section.
- Use cute/boutique symbols (✨, 💖, 🎀, 🌸, 💫) before and after headers as shown above.
- Use ALL CAPS for headers.
- ABSOLUTELY NO preamble or postamble text.
- TRIM all leading/trailing whitespace.
";

    let prompt = if lang == "both" {
        format!(
            "请为以下刺绣布贴产品生成详情描述文案。要求：中英文内容对应，专业且吸引人。

【英文要求】：遵循 Etsy 专业风格。{}

【输入信息】：
尺寸规格：{} (PRIORITY: Use this exact value for Size section)
标题：{} / {}
标签：{}
当前描述：{}

【输出规则】：
1. 中文文案：专业详细，突出材质和适用场景。注意：严禁包含任何关于“包装”、“物流”、“发货”或“快递”的内容，保持纯粹的产品属性描述。
2. 英文文案：地道简洁，不要长篇大论。
3. 使用纯文本格式（不要带 HTML 标签），使用换行符分隔。
4. 必须直接返回 JSON 格式（不要包含任何解释性文字、开场白或思考过程）：
{{
  \"zh\": \"内容\",
  \"en\": \"Content\"
}}",
            en_style_guide, product.size_spec, product.title_zh, product.title_en, product.tags.join(", "), product.description_zh
        )
    } else if lang == "zh" {
        format!(
            "请为以下刺绣布贴产品生成【中文】详情描述文案。
要求：专业 SEO 优化，突出特点（如材质、背胶、适用场景）。
注意：严禁包含任何关于“包装”、“物流”、“发货”或“快递”的内容，保持纯粹的产品属性描述。
使用纯文本格式输出（不要带 HTML 标签）。

标题：{}
关键词：{}
描述：{}

【重要规则】：不要包含任何多余文字（如：好的、这是为您生成的、思考过程等）。
必须直接返回 JSON 格式：
{{
  \"content\": \"生成的文案内容\"
}}",
            product.title_zh, product.tags.join(", "), product.description_zh
        )
    } else {
        format!(
            "Generate a professional 【English】 description for this embroidery patch using Etsy Boutique Style.
{}

【Product Info】：
Size Specification: {}
Title: {}
Keywords: {}
Current Desc: {}

【Output Rules】：
1. NO HTML TAGS. Plain text only.
2. Use newlines for spacing.
3. NO PREAMBLE, NO META-TEXT, NO REFLECTION.
4. MUST return JSON format only:
{{
  \"content\": \"generated content\"
}}",
            en_style_guide, product.size_spec, product.title_en, product.tags.join(", "), product.description_en
        )
    };

    let response = call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    let json_str = clean_ai_response(&response);

    let mut result = serde_json::json!({"zh": "", "en": ""});

    if lang == "both" {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
            result["zh"] = json["zh"].clone();
            result["en"] = json["en"].clone();
        }
    } else {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&json_str) {
            let content = json["content"].as_str().unwrap_or("").to_string();
            if lang == "zh" {
                result["zh"] = serde_json::json!(content);
            } else {
                result["en"] = serde_json::json!(content);
            }
        }
    }

    Ok(result)
}

#[tauri::command]
fn test_ai_connection(api_key: String, base_url: String, model: String) -> Result<String, String> {
    let prompt = "请回复：连接成功";
    let res = call_ai_chat(&base_url, &api_key, &model, prompt)?;
    Ok(res)
}

mod orbit;
pub use orbit::{OrbitResult, orbit_prompt_engine};

// ============================================================
// App Builder
// ============================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_dir = dirs::data_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    let app_dir = app_dir.join("com.goldenkey.app");
    std::fs::create_dir_all(&app_dir).ok();
    let db_path = app_dir.join("golden_key.db");

    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_db(&conn).expect("Failed to init database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DbConn(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            get_all_products,
            get_product,
            create_product,
            update_product,
            delete_product,
            ai_generate_title,
            ai_generate_guide_title,
            ai_generate_sku_title,
            ai_suggest_price,
            ai_generate_description,
            test_ai_connection,
            ai_extract_size,
            delete_products,
            orbit_prompt_engine,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
