/**
 * AI Analyzer Utilities for GameOn Platform
 * Integrates Google Vision API and OpenAI for various AI-powered features
 */

const vision = require('@google-cloud/vision');
const { Configuration, OpenAIApi } = require('openai');

// Initialize Google Vision API client
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

// Initialize OpenAI API client
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

/**
 * Analyze BGMI screenshot for match results
 * @param {string|Buffer} imageData - Base64 string or Buffer of the image
 * @returns {Object} Analysis results including rank, kills, and cheat detection
 */
const analyzeBGMIScreenshot = async (imageData) => {
  try {
    let imageBuffer;
    
    // Handle different input formats
    if (typeof imageData === 'string') {
      // Base64 string
      imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    } else {
      // Already a buffer
      imageBuffer = imageData;
    }

    // Use Google Vision API for text detection
    const [textDetections] = await visionClient.textDetection({ image: { content: imageBuffer } });
    const detectedText = textDetections.textAnnotations[0]?.description || '';

    // Use Google Vision API for object detection to identify game elements
    const [objectDetections] = await visionClient.objectLocalization({ image: { content: imageBuffer } });

    // Analyze the detected text for game statistics
    const analysisResult = await analyzeGameText(detectedText);

    // Check for cheating indicators using image analysis
    const cheatAnalysis = await detectCheatingPatterns(imageBuffer, detectedText);

    // Verify if this is actually a BGMI screenshot
    const gameVerification = await verifyBGMIScreenshot(detectedText, objectDetections.localizedObjectAnnotations);

    return {
      success: true,
      data: {
        rank: analysisResult.rank,
        kills: analysisResult.kills,
        damage: analysisResult.damage,
        survivalTime: analysisResult.survivalTime,
        gameMode: analysisResult.gameMode,
        isValidScreenshot: gameVerification.isValid,
        confidence: gameVerification.confidence,
        cheatFlags: cheatAnalysis.flags,
        riskScore: cheatAnalysis.riskScore,
        detectedText: process.env.NODE_ENV === 'development' ? detectedText : undefined
      }
    };

  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return {
      success: false,
      error: 'Failed to analyze screenshot',
      details: error.message
    };
  }
};

/**
 * Analyze detected text for BGMI game statistics
 * @param {string} text - Detected text from the image
 * @returns {Object} Parsed game statistics
 */
const analyzeGameText = async (text) => {
  try {
    const result = {
      rank: null,
      kills: null,
      damage: null,
      survivalTime: null,
      gameMode: null
    };

    // Regular expressions for different game statistics
    const patterns = {
      rank: /#(\d+)/i,
      kills: /kills?[:\s]*(\d+)/i,
      damage: /damage[:\s]*(\d+)/i,
      survivalTime: /(\d{1,2}:\d{2})/,
      winner: /winner|chicken dinner|victory/i
    };

    // Extract rank
    const rankMatch = text.match(patterns.rank);
    if (rankMatch) {
      result.rank = parseInt(rankMatch[1]);
    } else if (patterns.winner.test(text)) {
      result.rank = 1; // Winner
    }

    // Extract kills
    const killsMatch = text.match(patterns.kills);
    if (killsMatch) {
      result.kills = parseInt(killsMatch[1]);
    }

    // Extract damage
    const damageMatch = text.match(patterns.damage);
    if (damageMatch) {
      result.damage = parseInt(damageMatch[1]);
    }

    // Extract survival time
    const timeMatch = text.match(patterns.survivalTime);
    if (timeMatch) {
      result.survivalTime = timeMatch[1];
    }

    // Determine game mode based on text patterns
    if (/squad|team/i.test(text)) {
      result.gameMode = 'squad';
    } else if (/duo/i.test(text)) {
      result.gameMode = 'duo';
    } else {
      result.gameMode = 'solo';
    }

    return result;

  } catch (error) {
    console.error('Game text analysis error:', error);
    return {
      rank: null,
      kills: null,
      damage: null,
      survivalTime: null,
      gameMode: null
    };
  }
};

/**
 * Detect potential cheating patterns in screenshots
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} text - Detected text
 * @returns {Object} Cheat detection results
 */
const detectCheatingPatterns = async (imageBuffer, text) => {
  try {
    const flags = [];
    let riskScore = 0;

    // Check for unrealistic statistics
    const killsMatch = text.match(/kills?[:\s]*(\d+)/i);
    if (killsMatch) {
      const kills = parseInt(killsMatch[1]);
      if (kills > 30) {
        flags.push('unrealistic_kills');
        riskScore += 30;
      }
    }

    // Check for damage patterns
    const damageMatch = text.match(/damage[:\s]*(\d+)/i);
    if (damageMatch) {
      const damage = parseInt(damageMatch[1]);
      if (damage > 4000) {
        flags.push('unrealistic_damage');
        riskScore += 20;
      }
    }

    // Check for screenshot manipulation using image analysis
    const [safeSearchResult] = await visionClient.safeSearchDetection({ image: { content: imageBuffer } });
    const safeSearch = safeSearchResult.safeSearchAnnotation;

    // Check image quality and potential editing
    const [imageProperties] = await visionClient.imageProperties({ image: { content: imageBuffer } });
    
    // Analyze color distribution for potential editing
    if (imageProperties.imagePropertiesAnnotation) {
      const colors = imageProperties.imagePropertiesAnnotation.dominantColors.colors;
      // Add logic to detect unusual color patterns that might indicate editing
    }

    // Use OpenAI to analyze the text for suspicious patterns
    if (text.length > 50) {
      const suspiciousTextAnalysis = await analyzeTextWithOpenAI(text);
      if (suspiciousTextAnalysis.isSuspicious) {
        flags.push('suspicious_text_patterns');
        riskScore += suspiciousTextAnalysis.riskScore;
      }
    }

    // Check for common cheat indicators in text
    const cheatKeywords = ['hack', 'cheat', 'mod', 'esp', 'aimbot', 'wallhack'];
    const suspiciousKeywords = cheatKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (suspiciousKeywords.length > 0) {
      flags.push('cheat_keywords_detected');
      riskScore += suspiciousKeywords.length * 15;
    }

    return {
      flags,
      riskScore: Math.min(riskScore, 100), // Cap at 100
      details: {
        suspiciousKeywords,
        imageQuality: imageProperties.imagePropertiesAnnotation ? 'analyzed' : 'unknown'
      }
    };

  } catch (error) {
    console.error('Cheat detection error:', error);
    return {
      flags: ['analysis_error'],
      riskScore: 0,
      details: { error: error.message }
    };
  }
};

/**
 * Verify if the screenshot is actually from BGMI
 * @param {string} text - Detected text
 * @param {Array} objects - Detected objects
 * @returns {Object} Verification results
 */
const verifyBGMIScreenshot = async (text, objects = []) => {
  try {
    let confidence = 0;
    const indicators = [];

    // Check for BGMI-specific text patterns
    const bgmiPatterns = [
      /battlegrounds mobile india/i,
      /bgmi/i,
      /pubg/i,
      /chicken dinner/i,
      /winner winner/i,
      /survived/i,
      /eliminated/i,
      /zone/i,
      /squad|duo|solo/i
    ];

    bgmiPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        confidence += 10;
        indicators.push(pattern.source);
      }
    });

    // Check for UI elements typical in BGMI
    const uiElements = [
      /minimap/i,
      /inventory/i,
      /health/i,
      /armor/i,
      /kills/i,
      /damage/i,
      /rank/i
    ];

    uiElements.forEach(element => {
      if (element.test(text)) {
        confidence += 5;
      }
    });

    // Analyze objects detected in the image
    objects.forEach(obj => {
      const name = obj.name.toLowerCase();
      if (['person', 'weapon', 'vehicle', 'building'].includes(name)) {
        confidence += 3;
      }
    });

    const isValid = confidence >= 30; // Threshold for validation

    return {
      isValid,
      confidence: Math.min(confidence, 100),
      indicators,
      objectsDetected: objects.length
    };

  } catch (error) {
    console.error('Screenshot verification error:', error);
    return {
      isValid: false,
      confidence: 0,
      indicators: [],
      error: error.message
    };
  }
};

/**
 * Analyze text using OpenAI for suspicious patterns
 * @param {string} text - Text to analyze
 * @returns {Object} Analysis results
 */
const analyzeTextWithOpenAI = async (text) => {
  try {
    const prompt = `Analyze this gaming text for suspicious patterns that might indicate cheating or fake screenshots. Look for unrealistic statistics, inconsistencies, or unusual patterns. Text: "${text}"

    Respond with a JSON object containing:
    - isSuspicious: boolean
    - riskScore: number (0-50)
    - reasons: array of strings`;

    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt,
      max_tokens: 200,
      temperature: 0.3
    });

    const result = JSON.parse(response.data.choices[0].text.trim());
    return result;

  } catch (error) {
    console.error('OpenAI text analysis error:', error);
    return {
      isSuspicious: false,
      riskScore: 0,
      reasons: ['analysis_failed']
    };
  }
};

/**
 * Moderate chat messages using OpenAI
 * @param {string} message - Chat message to moderate
 * @param {string} context - Additional context about the conversation
 * @returns {Object} Moderation results
 */
const moderateChatMessage = async (message, context = '') => {
  try {
    // Use OpenAI's moderation endpoint
    const moderationResponse = await openai.createModeration({
      input: message
    });

    const moderation = moderationResponse.data.results[0];

    // Additional context-aware analysis
    const contextPrompt = `Analyze this gaming chat message for toxicity, harassment, cheating accusations, or inappropriate content. Consider the context of a competitive gaming platform.

    Message: "${message}"
    Context: "${context}"

    Respond with JSON:
    - shouldBlock: boolean
    - severity: "low"|"medium"|"high"
    - categories: array of violation types
    - explanation: string`;

    const contextResponse = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: contextPrompt,
      max_tokens: 150,
      temperature: 0.2
    });

    const contextAnalysis = JSON.parse(contextResponse.data.choices[0].text.trim());

    return {
      success: true,
      shouldBlock: moderation.flagged || contextAnalysis.shouldBlock,
      confidence: moderation.category_scores.harassment || 0,
      categories: [
        ...Object.keys(moderation.categories).filter(key => moderation.categories[key]),
        ...(contextAnalysis.categories || [])
      ],
      severity: contextAnalysis.severity || 'low',
      explanation: contextAnalysis.explanation,
      openaiFlags: moderation.categories
    };

  } catch (error) {
    console.error('Chat moderation error:', error);
    return {
      success: false,
      shouldBlock: false,
      error: error.message
    };
  }
};

/**
 * Generate player performance insights using AI
 * @param {Object} playerStats - Player's gaming statistics
 * @param {Array} recentMatches - Recent match data
 * @returns {Object} Performance insights and tips
 */
const generatePerformanceInsights = async (playerStats, recentMatches = []) => {
  try {
    const prompt = `Analyze this BGMI player's performance and provide insights and improvement tips.

    Player Stats:
    - Total Matches: ${playerStats.totalTournaments}
    - Wins: ${playerStats.tournamentsWon}
    - Win Rate: ${playerStats.winRate}%
    - Total Kills: ${playerStats.totalKills}
    - Average Rank: ${playerStats.averageRank}

    Recent Performance: ${JSON.stringify(recentMatches.slice(0, 5))}

    Provide a JSON response with:
    - overallRating: "Beginner"|"Intermediate"|"Advanced"|"Pro"
    - strengths: array of strings
    - weaknesses: array of strings
    - tips: array of specific improvement suggestions
    - nextGoal: string describing recommended next milestone`;

    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt,
      max_tokens: 400,
      temperature: 0.7
    });

    const insights = JSON.parse(response.data.choices[0].text.trim());

    return {
      success: true,
      insights
    };

  } catch (error) {
    console.error('Performance insights error:', error);
    return {
      success: false,
      insights: {
        overallRating: "Unknown",
        strengths: [],
        weaknesses: [],
        tips: ["Keep practicing and analyzing your gameplay!"],
        nextGoal: "Play more matches to build your statistics"
      }
    };
  }
};

module.exports = {
  analyzeBGMIScreenshot,
  moderateChatMessage,
  generatePerformanceInsights,
  verifyBGMIScreenshot,
  detectCheatingPatterns
};
