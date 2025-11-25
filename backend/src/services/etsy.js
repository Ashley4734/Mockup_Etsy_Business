const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

class EtsyService {
  constructor(tokens) {
    this.tokens = tokens;
    this.baseUrl = 'https://openapi.etsy.com/v3';
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthUrl(state) {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.ETSY_API_KEY,
      redirect_uri: process.env.ETSY_REDIRECT_URI,
      scope: 'listings_w listings_r shops_r',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return {
      url: `https://www.etsy.com/oauth/connect?${params.toString()}`,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code, codeVerifier) {
    try {
      const response = await axios.post('https://api.etsy.com/v3/public/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.ETSY_API_KEY,
        redirect_uri: process.env.ETSY_REDIRECT_URI,
        code: code,
        code_verifier: codeVerifier
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data || error);
      throw new Error('Failed to get Etsy tokens');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      const response = await axios.post('https://api.etsy.com/v3/public/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.ETSY_API_KEY,
        refresh_token: this.tokens.refresh_token
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.tokens = response.data;
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error);
      throw new Error('Failed to refresh Etsy token');
    }
  }

  /**
   * Make authenticated request to Etsy API
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
          'x-api-key': process.env.ETSY_API_KEY,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      // Try to refresh token if unauthorized
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        // Retry the request
        return this.makeRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  /**
   * Get user's shop information
   */
  async getUserShops() {
    try {
      const data = await this.makeRequest('GET', '/application/shops');
      return data.results || [];
    } catch (error) {
      console.error('Error getting user shops:', error.response?.data || error);
      throw new Error('Failed to get Etsy shops');
    }
  }

  /**
   * Create a draft listing
   */
  async createDraftListing(shopId, listingData) {
    try {
      const payload = {
        quantity: 999, // Digital products can have high quantity
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        who_made: 'i_did',
        when_made: '2020_2024',
        taxonomy_id: listingData.taxonomy_id || 2322, // Digital prints category
        shipping_profile_id: listingData.shipping_profile_id || null,
        return_policy_id: listingData.return_policy_id || null,
        type: 'download', // Digital download
        is_supply: false,
        tags: listingData.tags,
        state: 'draft' // Create as draft first
      };

      const response = await this.makeRequest(
        'POST',
        `/application/shops/${shopId}/listings`,
        payload
      );

      return response;
    } catch (error) {
      console.error('Error creating draft listing:', error.response?.data || error);
      throw new Error('Failed to create Etsy listing: ' + (error.response?.data?.error || error.message));
    }
  }

  /**
   * Upload digital file to listing
   */
  async uploadDigitalFile(shopId, listingId, fileBuffer, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      const response = await axios.post(
        `${this.baseUrl}/application/shops/${shopId}/listings/${listingId}/files`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.tokens.access_token}`,
            'x-api-key': process.env.ETSY_API_KEY
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading digital file:', error.response?.data || error);
      throw new Error('Failed to upload digital file to Etsy');
    }
  }

  /**
   * Upload listing image
   */
  async uploadListingImage(shopId, listingId, imageBuffer, rank = 1) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, 'mockup.jpg');
      formData.append('rank', rank);

      const response = await axios.post(
        `${this.baseUrl}/application/shops/${shopId}/listings/${listingId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.tokens.access_token}`,
            'x-api-key': process.env.ETSY_API_KEY
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading listing image:', error.response?.data || error);
      throw new Error('Failed to upload image to Etsy listing');
    }
  }

  /**
   * Activate listing (make it live)
   */
  async activateListing(shopId, listingId) {
    try {
      const response = await this.makeRequest(
        'PUT',
        `/application/shops/${shopId}/listings/${listingId}`,
        { state: 'active' }
      );

      return response;
    } catch (error) {
      console.error('Error activating listing:', error.response?.data || error);
      throw new Error('Failed to activate Etsy listing');
    }
  }

  /**
   * Get shipping profiles
   */
  async getShippingProfiles(shopId) {
    try {
      const data = await this.makeRequest('GET', `/application/shops/${shopId}/shipping-profiles`);
      return data.results || [];
    } catch (error) {
      console.error('Error getting shipping profiles:', error);
      return [];
    }
  }

  /**
   * Get return policies
   */
  async getReturnPolicies(shopId) {
    try {
      const data = await this.makeRequest('GET', `/application/shops/${shopId}/policies/return`);
      return data.results || [];
    } catch (error) {
      console.error('Error getting return policies:', error);
      return [];
    }
  }
}

module.exports = EtsyService;
