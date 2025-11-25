const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze mockup image and generate listing content
   * @param {Buffer|string} image - Image buffer or base64 string
   * @param {Array} customSections - Array of custom section templates to include
   * @returns {Object} Generated listing content
   */
  async analyzeImageAndGenerateListing(imageBase64, customSections = []) {
    try {
      // Create the custom sections prompt
      let customSectionsPrompt = '';
      if (customSections && customSections.length > 0) {
        customSectionsPrompt = '\n\nInclude these custom sections in the description:\n';
        customSections.forEach((section, index) => {
          customSectionsPrompt += `${index + 1}. ${section.name}: ${section.content}\n`;
        });
      }

      const prompt = `You are an expert Etsy listing creator specializing in digital mockup products. Analyze this mockup image and generate compelling Etsy listing content.

Generate the following in JSON format:
{
  "title": "A compelling, keyword-rich title (max 140 characters)",
  "description": "A detailed, engaging product description with proper formatting. Include: what the customer gets, how to use it, file details, and benefits.",
  "tags": ["13 relevant search tags (single words or 2-3 word phrases)"],
  "suggestedCategory": "Suggested Etsy category",
  "imageAnalysis": "Brief description of what you see in the mockup"
}

Requirements for the title:
- Must be under 140 characters
- Include relevant keywords for Etsy search
- Be specific about the product type (mockup, template, digital product)
- Make it appealing to buyers

Requirements for the description:
- Start with a compelling hook
- Clearly explain what the buyer receives
- Include file format and usage information
- Add formatting with bullet points and sections
- Be professional but friendly
- Highlight the benefits and use cases${customSectionsPrompt}

Requirements for tags:
- Exactly 13 tags
- Each tag max 20 characters
- Mix of broad and specific terms
- Include relevant keywords for Etsy search
- Use lowercase

Analyze the image carefully and create content that would help this mockup sell well on Etsy.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });

      const content = JSON.parse(response.choices[0].message.content);

      // Validate and clean up the response
      return {
        title: content.title?.substring(0, 140) || 'Digital Mockup',
        description: content.description || '',
        tags: (content.tags || []).slice(0, 13).map(tag => tag.toLowerCase().substring(0, 20)),
        suggestedCategory: content.suggestedCategory || 'Art & Collectibles',
        imageAnalysis: content.imageAnalysis || '',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating listing with OpenAI:', error);
      throw new Error('Failed to generate listing content: ' + error.message);
    }
  }

  /**
   * Enhance description with custom sections
   * @param {string} baseDescription - The base AI-generated description
   * @param {Array} customSections - Custom sections to add
   * @returns {string} Enhanced description
   */
  enhanceDescriptionWithSections(baseDescription, customSections = []) {
    if (!customSections || customSections.length === 0) {
      return baseDescription;
    }

    let enhanced = baseDescription + '\n\n';

    customSections.forEach(section => {
      enhanced += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      enhanced += `${section.name.toUpperCase()}\n`;
      enhanced += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      enhanced += `${section.content}\n`;
    });

    return enhanced;
  }

  /**
   * Generate tags from multiple images (for batch listings)
   * @param {Array} images - Array of base64 images
   * @returns {Array} Array of unique tags
   */
  async generateBatchTags(images) {
    try {
      const allTags = new Set();

      for (const imageBase64 of images) {
        const result = await this.analyzeImageAndGenerateListing(imageBase64);
        result.tags.forEach(tag => allTags.add(tag));
      }

      return Array.from(allTags).slice(0, 13);
    } catch (error) {
      console.error('Error generating batch tags:', error);
      throw new Error('Failed to generate batch tags');
    }
  }
}

module.exports = OpenAIService;
