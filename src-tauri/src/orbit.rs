use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrbitResult {
    pub mj_content: String,
    pub d3_content: String,
    pub insights: std::collections::HashMap<String, String>,
}

#[tauri::command]
pub async fn orbit_prompt_engine(
    user_input: String,
    selected_ids: Vec<String>,
    preferences: Vec<String>,
    api_key: String,
    base_url: String,
    model: String,
) -> Result<crate::OrbitResult, String> {
    // 构建专家视角提示词
    let expert_names: Vec<&str> = selected_ids.iter().map(|id| match id.as_str() {
        "director" => "艺术总监",
        "sketcher" => "草稿师",
        "renderer" => "渲染师",
        "illustrator" => "插画师",
        "copywriter" => "文案专家",
        "optimizer" => "优化专家",
        _ => "AI 专家",
    }).collect();

    let prompt = format!(
        "你是一个专业的 AI 提示词专家委员会。请根据用户的需求和偏好，生成两组高质量的 AI 绘画提示词。
        
        【用户需求】：{}
        【用户偏好】：{}
        【参与专家】：{}
        
        请输出以下 JSON 格式：
        {{
          \"mj_content\": \"适用于 Midjourney 的提示词 (包含参数如 --ar, --v)\",
          \"d3_content\": \"适用于 DALL-E 3 的提示词 (更具描述性的自然语言)\",
          \"insights\": {{
             \"director\": \"艺术总监的建议...\",
             \"renderer\": \"渲染师的建议...\"
          }}
        }}
        仅返回 JSON，不要有其他解释。",
        user_input,
        preferences.join(", "),
        expert_names.join(", ")
    );

    let response = crate::call_ai_chat(&base_url, &api_key, &model, &prompt)?;
    
    let json_str = if let (Some(s), Some(e)) = (response.find('{'), response.rfind('}')) {
        &response[s..=e]
    } else {
        &response
    };

    let result: crate::OrbitResult = serde_json::from_str(json_str).map_err(|e| format!("解析失败: {}. 响应: {}", e, response))?;
    Ok(result)
}
