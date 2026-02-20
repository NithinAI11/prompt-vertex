const getHistory = () => {
  const history = localStorage.getItem('promptHistory');
  return history ? JSON.parse(history) : [];
};

const saveToHistory = (originalPrompt, finalPrompt, score) => {
  const history = getHistory();
  const newEntry = {
    id: new Date().toISOString(),
    originalPrompt,
    finalPrompt,
    score,
    date: new Date().toLocaleString(),
  };
  history.unshift(newEntry);
  localStorage.setItem('promptHistory', JSON.stringify(history.slice(0, 50)));
};

const clearHistory = () => {
    localStorage.removeItem('promptHistory');
};

const getSettings = async () => {
  try {
    const response = await fetch('http://localhost:8001/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error fetching settings:", error);
    // Return a default structure on failure
    return {
      geminiApiKey: '', perplexityApiKey: '', openaiApiKey: '',
      anthropicApiKey: '', grokApiKey: '', tavilyApiKey: '',
      username: 'Guest', enableParticles: true,
    };
  }
};

const saveSettings = async (settings) => {
  try {
    const response = await fetch('http://localhost:8001/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error('Failed to save settings');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error saving settings:", error);
    return null;
  }
};

const getPromptSuggestions = async (inputText) => {
    const suggestions = [
        { id: 1, text: "Explain the concept of {topic} to a beginner." },
        { id: 2, text: "Create a short story about {character} in a {setting}." },
        { id: 3, text: "Generate a marketing copy for a new {product}." },
        { id: 4, text: "Write a Python script to {task}." },
        { id: 5, text: "Summarize the following article: {article_link}" }
    ];

    if (!inputText) {
        return Promise.resolve(suggestions.slice(0, 3));
    }

    const filtered = suggestions.filter(s =>
        s.text.toLowerCase().includes(inputText.toLowerCase())
    );
    return Promise.resolve(filtered);
};

const getTemplates = async () => {
  try {
    const response = await fetch('http://localhost:8001/templates/dynamic');
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dynamic templates:", error);
    return [];
  }
};

const incrementTemplateUsage = async (templateId) => {
  try {
    await fetch(`http://localhost:8001/templates/${templateId}/increment_usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Failed to increment usage count:", error);
  }
};

const getDetailedAnalysis = async (original_prompt, forged_prompt) => {
    try {
        const response = await fetch('http://localhost:8001/detailed-evaluation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original_prompt, forged_prompt }),
        });
        if (!response.ok) {
            throw new Error('Detailed evaluation request failed');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to get detailed analysis:", error);
        return null;
    }
};

export {
  getHistory,
  saveToHistory,
  getSettings,
  saveSettings,
  getTemplates,
  clearHistory,
  getPromptSuggestions,
  incrementTemplateUsage,
  getDetailedAnalysis
};