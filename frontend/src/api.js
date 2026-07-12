const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('scholarai_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('scholarai_token', token);
    } else {
      localStorage.removeItem('scholarai_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type if we're sending FormData (e.g. file upload)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth Endpoints
  async register(email, password, fullName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data && data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  logout() {
    this.setToken(null);
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request('/papers/stats', {
      method: 'GET',
    });
  }

  // Papers Endpoints
  async getPapers(search = '', collectionId = null) {
    let query = '';
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (collectionId) params.push(`collection_id=${collectionId}`);
    if (params.length > 0) {
      query = `?${params.join('&')}`;
    }
    return this.request(`/papers/${query}`, {
      method: 'GET',
    });
  }

  async getPaperDetails(id) {
    return this.request(`/papers/${id}`, {
      method: 'GET',
    });
  }

  async uploadPaper(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/papers/', {
      method: 'POST',
      body: formData,
    });
  }

  async updatePaper(id, updateData) {
    return this.request(`/papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deletePaper(id) {
    return this.request(`/papers/${id}`, {
      method: 'DELETE',
    });
  }

  async getSimilarPapers(id) {
    return this.request(`/papers/${id}/recommend`, {
      method: 'GET',
    });
  }

  // Collections Endpoints
  async getCollections() {
    return this.request('/collections/', {
      method: 'GET',
    });
  }

  async createCollection(name, description) {
    return this.request('/collections/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateCollection(id, name, description) {
    return this.request(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteCollection(id) {
    return this.request(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  async addPaperToCollection(collectionId, paperId) {
    return this.request(`/collections/${collectionId}/papers/${paperId}`, {
      method: 'POST',
    });
  }

  async removePaperFromCollection(collectionId, paperId) {
    return this.request(`/collections/${collectionId}/papers/${paperId}`, {
      method: 'DELETE',
    });
  }

  // Notes Endpoints
  async getNotes(paperId = null, search = '', tag = '') {
    const params = [];
    if (paperId) params.push(`paper_id=${paperId}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request(`/notes/${query}`, {
      method: 'GET',
    });
  }

  async createNote(paperId, content, pageNumber = null, highlightedText = null, tags = null) {
    return this.request('/notes/', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: paperId,
        content,
        page_number: pageNumber,
        highlighted_text: highlightedText,
        tags,
      }),
    });
  }

  async updateNote(id, content, pageNumber = null, highlightedText = null, tags = null) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        content,
        page_number: pageNumber,
        highlighted_text: highlightedText,
        tags,
      }),
    });
  }

  async deleteNote(id) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat/QA Endpoints
  async getChatHistory(paperId) {
    return this.request(`/chat/${paperId}`, {
      method: 'GET',
    });
  }

  async askQuestion(paperId, query) {
    return this.request('/chat/', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: paperId,
        query,
      }),
    });
  }
}

export const api = new ApiClient();
export default api;
