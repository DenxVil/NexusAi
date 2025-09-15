export class HistoryService {
    constructor(config) {
        this.config = config;
        this.history = [];
        this.maxItems = config.history.maxItems || 50;
        this.persistToLocalStorage = config.history.persistToLocalStorage || true;
        this.storageKey = config.history.storageKey || 'nexus_ai_chat_history';
        
        this.loadHistoryFromStorage();
    }

    // Add a new chat message to history
    addMessage(message) {
        const timestamp = new Date().toISOString();
        const historyItem = {
            id: this.generateId(),
            timestamp,
            ...message
        };

        this.history.unshift(historyItem); // Add to beginning for most recent first

        // Trim history if it exceeds max items
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }

        this.saveHistoryToStorage();
        return historyItem;
    }

    // Add a conversation pair (user message and AI response)
    addConversation(userMessage, aiResponse, metadata = {}) {
        const conversationId = this.generateId();
        const timestamp = new Date().toISOString();

        const userItem = this.addMessage({
            conversationId,
            type: 'user',
            content: userMessage,
            ...metadata
        });

        const aiItem = this.addMessage({
            conversationId,
            type: 'assistant',
            content: aiResponse,
            service: metadata.service || 'unknown',
            ...metadata
        });

        return { userItem, aiItem, conversationId };
    }

    // Get all history items
    getHistory() {
        return [...this.history]; // Return a copy to prevent direct modification
    }

    // Get history items with pagination
    getHistoryPage(page = 1, itemsPerPage = 20) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        return {
            items: this.history.slice(startIndex, endIndex),
            totalItems: this.history.length,
            currentPage: page,
            totalPages: Math.ceil(this.history.length / itemsPerPage),
            hasNext: endIndex < this.history.length,
            hasPrevious: page > 1
        };
    }

    // Get history by conversation ID
    getConversation(conversationId) {
        return this.history.filter(item => item.conversationId === conversationId);
    }

    // Search history by content
    searchHistory(query, type = null) {
        const lowerQuery = query.toLowerCase();
        return this.history.filter(item => {
            const matchesContent = item.content.toLowerCase().includes(lowerQuery);
            const matchesType = type ? item.type === type : true;
            return matchesContent && matchesType;
        });
    }

    // Delete a specific message
    deleteMessage(messageId) {
        const index = this.history.findIndex(item => item.id === messageId);
        if (index !== -1) {
            const deleted = this.history.splice(index, 1)[0];
            this.saveHistoryToStorage();
            return deleted;
        }
        return null;
    }

    // Delete entire conversation
    deleteConversation(conversationId) {
        const deleted = this.history.filter(item => item.conversationId === conversationId);
        this.history = this.history.filter(item => item.conversationId !== conversationId);
        this.saveHistoryToStorage();
        return deleted;
    }

    // Clear all history
    clearHistory() {
        this.history = [];
        this.saveHistoryToStorage();
    }

    // Export history as JSON
    exportHistory() {
        return JSON.stringify({
            exported: new Date().toISOString(),
            version: '1.0',
            totalItems: this.history.length,
            history: this.history
        }, null, 2);
    }

    // Import history from JSON
    importHistory(jsonData, merge = false) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.history || !Array.isArray(data.history)) {
                throw new Error('Invalid history format');
            }

            if (merge) {
                // Merge with existing history, avoiding duplicates
                const existingIds = new Set(this.history.map(item => item.id));
                const newItems = data.history.filter(item => !existingIds.has(item.id));
                this.history = [...this.history, ...newItems];
            } else {
                // Replace existing history
                this.history = data.history;
            }

            // Sort by timestamp (most recent first) and trim if necessary
            this.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }

            this.saveHistoryToStorage();
            return this.history.length;
        } catch (error) {
            throw new Error(`Failed to import history: ${error.message}`);
        }
    }

    // Get statistics about history
    getStatistics() {
        const stats = {
            totalMessages: this.history.length,
            userMessages: 0,
            assistantMessages: 0,
            conversations: new Set(),
            services: {},
            dateRange: null
        };

        if (this.history.length > 0) {
            const timestamps = this.history.map(item => new Date(item.timestamp));
            stats.dateRange = {
                oldest: new Date(Math.min(...timestamps)).toISOString(),
                newest: new Date(Math.max(...timestamps)).toISOString()
            };

            this.history.forEach(item => {
                if (item.type === 'user') stats.userMessages++;
                if (item.type === 'assistant') stats.assistantMessages++;
                if (item.conversationId) stats.conversations.add(item.conversationId);
                if (item.service) {
                    stats.services[item.service] = (stats.services[item.service] || 0) + 1;
                }
            });

            stats.totalConversations = stats.conversations.size;
            delete stats.conversations; // Remove Set object for cleaner output
        }

        return stats;
    }

    // Private methods
    generateId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    saveHistoryToStorage() {
        if (this.persistToLocalStorage && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.history));
            } catch (error) {
                console.warn('Failed to save history to localStorage:', error);
            }
        }
    }

    loadHistoryFromStorage() {
        if (this.persistToLocalStorage && typeof localStorage !== 'undefined') {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.history = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('Failed to load history from localStorage:', error);
                this.history = [];
            }
        }
    }
}