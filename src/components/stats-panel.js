// Statistics Panel Component
class StatsPanel {
    constructor() {
        this.overviewStats = document.getElementById('overviewStats');
        this.peopleList = document.getElementById('peopleList');
        this.placesList = document.getElementById('placesList');
        this.abbreviationsList = document.getElementById('abbreviationsList');
        this.topWordsList = document.getElementById('topWordsList');
        this.insightsList = document.getElementById('insightsList');
        
        // Pagination elements
        this.peoplePagination = document.getElementById('peoplePagination');
        this.placesPagination = document.getElementById('placesPagination');
        this.abbreviationsPagination = document.getElementById('abbreviationsPagination');
        this.topWordsPagination = document.getElementById('topWordsPagination');
        this.insightsPagination = document.getElementById('insightsPagination');
        
        // Pagination state
        this.itemsPerPage = 5;
        this.paginationState = {
            people: { currentPage: 1, totalItems: 0, items: [] },
            places: { currentPage: 1, totalItems: 0, items: [] },
            abbreviations: { currentPage: 1, totalItems: 0, items: [] },
            topWords: { currentPage: 1, totalItems: 0, items: [] },
            insights: { currentPage: 1, totalItems: 0, items: [] }
        };
        
        // Track current word navigation
        this.currentWord = null;
        this.currentOccurrenceIndex = 0;
        this.matchingSpans = [];
        
        // Navigation bar elements
        this.wordNavBar = document.getElementById('wordNavBar');
        this.navWordDisplay = document.getElementById('navWordDisplay');
        this.navOccurrenceInput = document.getElementById('navOccurrenceInput');
        this.navTotalCount = document.getElementById('navTotalCount');
        
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchStatus = document.getElementById('searchStatus');

        // Writing Style elements
        this.gradeLevel = document.getElementById('gradeLevel');
        this.readingTime = document.getElementById('readingTime');
        this.lexicalDiversity = document.getElementById('lexicalDiversity');
        this.avgSentenceLength = document.getElementById('avgSentenceLength');
        
        // Setup navigation buttons, search, and pagination
        this.setupNavigationButtons();
        this.setupSearch();
        this.setupPagination();
    }
    
    setupPagination() {
        // Setup pagination for each list
        const lists = [
            { name: 'people', pagination: this.peoplePagination, container: this.peopleList },
            { name: 'places', pagination: this.placesPagination, container: this.placesList },
            { name: 'abbreviations', pagination: this.abbreviationsPagination, container: this.abbreviationsList },
            { name: 'topWords', pagination: this.topWordsPagination, container: this.topWordsList },
            { name: 'insights', pagination: this.insightsPagination, container: this.insightsList }
        ];
        
        lists.forEach(list => {
            const prevBtn = list.pagination.querySelector('.prev-btn');
            const nextBtn = list.pagination.querySelector('.next-btn');
            
            prevBtn.addEventListener('click', () => {
                this.changePage(list.name, -1);
            });
            
            nextBtn.addEventListener('click', () => {
                this.changePage(list.name, 1);
            });
        });
    }
    
    changePage(listName, direction) {
        const state = this.paginationState[listName];
        state.currentPage += direction;
        
        // Clamp to valid range
        const totalPages = Math.ceil(state.totalItems / this.itemsPerPage);
        state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));
        
        // Re-render the list
        this.renderPaginatedList(listName);
    }
    
    renderPaginatedList(listName) {
        const state = this.paginationState[listName];
        const startIdx = (state.currentPage - 1) * this.itemsPerPage;
        const endIdx = startIdx + this.itemsPerPage;
        const pageItems = state.items.slice(startIdx, endIdx);
        
        // Determine which container and type to use
        let container, type, pagination;
        switch(listName) {
            case 'people':
                container = this.peopleList;
                pagination = this.peoplePagination;
                type = 'person';
                break;
            case 'places':
                container = this.placesList;
                pagination = this.placesPagination;
                type = 'place';
                break;
            case 'abbreviations':
                container = this.abbreviationsList;
                pagination = this.abbreviationsPagination;
                type = 'abbreviation';
                break;
            case 'topWords':
                container = this.topWordsList;
                pagination = this.topWordsPagination;
                type = 'word';
                break;
            case 'insights':
                container = this.insightsList;
                pagination = this.insightsPagination;
                type = 'unique';
                break;
        }
        
        // Render items
        if (pageItems.length === 0) {
            container.innerHTML = '<div class="placeholder-text">None found</div>';
            pagination.classList.add('hidden');
            return;
        }
        
        const html = pageItems.map(item => `
            <div class="entity-item" data-word="${this.escapeHtml(item.word)}" data-type="${item.type || type}">
                <span class="entity-word">${this.escapeHtml(item.word)}</span>
                <span class="entity-count">${item.count}</span>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Add click listeners
        container.querySelectorAll('.entity-item').forEach(item => {
            item.addEventListener('click', () => {
                const word = item.getAttribute('data-word');
                this.highlightWordInText(word);
            });
        });
        
        // Update pagination controls
        const totalPages = Math.ceil(state.totalItems / this.itemsPerPage);
        const paginationInfo = pagination.querySelector('.pagination-info');
        paginationInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
        
        const prevBtn = pagination.querySelector('.prev-btn');
        const nextBtn = pagination.querySelector('.next-btn');
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === totalPages;
        
        // Show pagination if more than one page
        if (totalPages > 1) {
            pagination.classList.remove('hidden');
        } else {
            pagination.classList.add('hidden');
        }
    }
    
    setupSearch() {
        // Search button click
        this.searchBtn.addEventListener('click', () => {
            this.performSearch();
        });
        
        // Enter key in search input
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission if any
                this.performSearch();
            }
        });
        
        // Listen for map search completion
        document.addEventListener('map-search-complete', (e) => {
            if (e.detail) {
                const { matchCount, word } = e.detail;
                if (matchCount > 0) {
                    this.searchStatus.textContent = `✓ Found ${matchCount} occurrence${matchCount !== 1 ? 's' : ''}`;
                    this.searchStatus.className = 'search-status found';
                } else {
                    this.searchStatus.textContent = '✗ No matches found';
                    this.searchStatus.className = 'search-status not-found';
                }
            }
        });
    }

    reset() {
        // Reset overview
        const statCards = this.overviewStats.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-value').textContent = '-';
            statCards[1].querySelector('.stat-value').textContent = '-';
            statCards[2].querySelector('.stat-value').textContent = '-';
            statCards[3].querySelector('.stat-value').textContent = '-';
        }

        // Reset all lists
        const lists = [
            { name: 'people', pagination: this.peoplePagination, container: this.peopleList },
            { name: 'places', pagination: this.placesPagination, container: this.placesList },
            { name: 'abbreviations', pagination: this.abbreviationsPagination, container: this.abbreviationsList },
            { name: 'topWords', pagination: this.topWordsPagination, container: this.topWordsList },
            { name: 'insights', pagination: this.insightsPagination, container: this.insightsList }
        ];

        lists.forEach(list => {
            list.container.innerHTML = '<div class="placeholder-text">No items detected</div>';
            list.pagination.classList.add('hidden');
            this.paginationState[list.name] = { currentPage: 1, totalItems: 0, items: [] };
        });

        // Reset Search
        this.searchInput.value = '';
        this.searchStatus.textContent = '';
        this.searchStatus.className = 'search-status';

        // Reset Writing Style
        if (this.gradeLevel) this.gradeLevel.textContent = '-';
        if (this.readingTime) this.readingTime.textContent = '-';
        if (this.lexicalDiversity) this.lexicalDiversity.textContent = '-';
        if (this.avgSentenceLength) this.avgSentenceLength.textContent = '-';

        // Reset Navigation
        this.hideNavigationBar();
    }
    
    performSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (!searchTerm) {
            this.searchStatus.textContent = 'Please enter a word or phrase to search';
            this.searchStatus.className = 'search-status';
            return;
        }
        
        // Use the existing highlightWordInText functionality
        // But first, reset to treat this as a new search
        this.currentWord = null;
        this.highlightWordInText(searchTerm);
        
        // Update search status after a delay to let the search complete (increased from 200ms to 400ms)
        setTimeout(() => {
            if (this.matchingSpans.length > 0) {
                this.searchStatus.textContent = `✓ Found ${this.matchingSpans.length} occurrence${this.matchingSpans.length !== 1 ? 's' : ''}`;
                this.searchStatus.className = 'search-status found';
            } else {
                this.searchStatus.textContent = '✗ No matches found';
                this.searchStatus.className = 'search-status not-found';
            }
        }, 400);
    }
    
    setupNavigationButtons() {
        document.getElementById('prevOccurrenceBtn').addEventListener('click', () => {
            this.navigateToPrevious();
        });
        
        document.getElementById('nextOccurrenceBtn').addEventListener('click', () => {
            this.navigateToNext();
        });
        
        document.getElementById('closeNavBtn').addEventListener('click', () => {
            this.hideNavigationBar();
        });

        if (this.navOccurrenceInput) {
            this.navOccurrenceInput.addEventListener('change', (e) => {
                if (this.matchingSpans.length > 0) {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > this.matchingSpans.length) val = this.matchingSpans.length;
                    
                    this.currentOccurrenceIndex = val - 1;
                    this.scrollToMatch();
                }
            });
            
            this.navOccurrenceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        }
        
        // Keyboard shortcuts for navigation
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when navigation bar is visible
            if (!this.wordNavBar.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                    e.preventDefault();
                    this.navigateToPrevious();
                } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                    e.preventDefault();
                    this.navigateToNext();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hideNavigationBar();
                }
            }
        });
    }
    
    showNavigationBar() {
        this.wordNavBar.classList.remove('hidden');
    }
    
    hideNavigationBar() {
        this.wordNavBar.classList.add('hidden');
        
        // Clear highlights
        if (this.matchingSpans.length > 0) {
            this.matchingSpans.forEach(span => {
                span.style.outline = 'none';
            });
        }
        
        // Remove search highlight marks
        const highlightedContent = document.getElementById('highlightedTextContent');
        const searchHighlights = highlightedContent.querySelectorAll('.search-highlight');
        searchHighlights.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize(); // Merge adjacent text nodes
            }
        });
        
        this.currentWord = null;
        this.currentOccurrenceIndex = 0;
        this.matchingSpans = [];
        
        // Clear search status
        this.searchStatus.textContent = '';
        this.searchStatus.className = 'search-status';
    }
    
    updateNavigationBar() {
        if (this.currentWord && this.matchingSpans.length > 0) {
            this.navWordDisplay.textContent = `"${this.currentWord}"`;
            
            if (this.navOccurrenceInput) {
                this.navOccurrenceInput.value = this.currentOccurrenceIndex + 1;
                this.navOccurrenceInput.max = this.matchingSpans.length;
            }
            
            if (this.navTotalCount) {
                this.navTotalCount.textContent = this.matchingSpans.length;
            }
        }
    }
    
    navigateToPrevious() {
        if (this.matchingSpans.length === 0) return;
        
        this.currentOccurrenceIndex--;
        if (this.currentOccurrenceIndex < 0) {
            this.currentOccurrenceIndex = this.matchingSpans.length - 1;
        }
        
        this.scrollToCurrentOccurrence();
    }
    
    navigateToNext() {
        if (this.matchingSpans.length === 0) return;
        
        this.currentOccurrenceIndex++;
        if (this.currentOccurrenceIndex >= this.matchingSpans.length) {
            this.currentOccurrenceIndex = 0;
        }
        
        this.scrollToCurrentOccurrence();
    }
    
    scrollToCurrentOccurrence() {
        if (this.matchingSpans.length === 0) return;
        
        const currentSpan = this.matchingSpans[this.currentOccurrenceIndex];
        
        // Clear previous highlights
        this.matchingSpans.forEach(span => {
            span.style.outline = 'none';
        });
        
        // Highlight current occurrence
        currentSpan.style.outline = '3px solid #ff9800';
        currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update navigation bar
        this.updateNavigationBar();
        
        // Auto-remove highlight after 2 seconds
        setTimeout(() => {
            currentSpan.style.outline = 'none';
        }, 2000);
    }
    
    renderStats(analysis, sourceView = 'highlighted') {
        // Store source view for navigation
        this.currentSourceView = sourceView;

        // Reset word navigation and clean up search highlights when new stats are loaded
        this.hideNavigationBar();
        
        this.renderOverview(analysis.stats);
        
        if (analysis.writingStyle) {
            this.renderWritingStyle(analysis.writingStyle);
        }
        
        // Store items and render with pagination
        this.paginationState.people.items = analysis.entities.people || [];
        this.paginationState.people.totalItems = this.paginationState.people.items.length;
        this.paginationState.people.currentPage = 1;
        this.renderPaginatedList('people');
        
        this.paginationState.places.items = analysis.entities.places || [];
        this.paginationState.places.totalItems = this.paginationState.places.items.length;
        this.paginationState.places.currentPage = 1;
        this.renderPaginatedList('places');
        
        this.paginationState.abbreviations.items = analysis.entities.abbreviations || [];
        this.paginationState.abbreviations.totalItems = this.paginationState.abbreviations.items.length;
        this.paginationState.abbreviations.currentPage = 1;
        this.renderPaginatedList('abbreviations');
        
        this.paginationState.topWords.items = analysis.topWords || [];
        this.paginationState.topWords.totalItems = this.paginationState.topWords.items.length;
        this.paginationState.topWords.currentPage = 1;
        this.renderPaginatedList('topWords');
        
        this.paginationState.insights.items = analysis.uniqueInsights || [];
        this.paginationState.insights.totalItems = this.paginationState.insights.items.length;
        this.paginationState.insights.currentPage = 1;
        this.renderPaginatedList('insights');
    }
    
    renderOverview(stats) {
        const statCards = this.overviewStats.querySelectorAll('.stat-card');
        
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-value').textContent = 
                this.formatNumber(stats.totalWords);
            statCards[1].querySelector('.stat-value').textContent = 
                this.formatNumber(stats.uniqueWords);
            statCards[2].querySelector('.stat-value').textContent = 
                this.formatNumber(stats.sentences);
            statCards[3].querySelector('.stat-value').textContent = 
                stats.pages ? this.formatNumber(stats.pages) : '-';
        }
    }

    renderWritingStyle(style) {
        if (this.gradeLevel) this.gradeLevel.textContent = style.gradeLevel || '-';
        if (this.readingTime) this.readingTime.textContent = style.readingTimeMinutes || '-';
        if (this.lexicalDiversity) this.lexicalDiversity.textContent = style.lexicalDiversity ? `${style.lexicalDiversity}%` : '-';
        if (this.avgSentenceLength) this.avgSentenceLength.textContent = style.avgSentenceLength || '-';
    }
    
    renderEntityList(container, items, type) {
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="placeholder-text">None found</div>';
            return;
        }
        
        const html = items.map(item => `
            <div class="entity-item" data-word="${this.escapeHtml(item.word)}" data-type="${type}">
                <span class="entity-word">${this.escapeHtml(item.word)}</span>
                <span class="entity-count">${item.count}</span>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Add click listeners
        container.querySelectorAll('.entity-item').forEach(item => {
            item.addEventListener('click', () => {
                const word = item.getAttribute('data-word');
                this.highlightWordInText(word);
            });
        });
    }
    
    highlightWordInText(word) {
        // Check active view
        const mapBtn = document.getElementById('mapBtn');
        const isMapView = mapBtn && mapBtn.classList.contains('active');
        
        if (isMapView) {
            // Dispatch event for renderer to handle map highlighting
            const event = new CustomEvent('highlight-map-word', { detail: { word } });
            document.dispatchEvent(event);
            return;
        }

        // Determine target view and container based on source
        let targetContentId = 'highlightedTextContent';
        let targetBtnId = 'highlightedTextBtn';

        if (this.currentSourceView === 'translate') {
            targetContentId = 'translatedTextContent';
            targetBtnId = 'translateTabBtn';
        }

        // Switch to appropriate view
        const btn = document.getElementById(targetBtnId);
        if (btn) btn.click();
        
        // Check for stale DOM references (if content was re-rendered)
        if (this.matchingSpans.length > 0 && !document.body.contains(this.matchingSpans[0])) {
            this.matchingSpans = [];
            this.currentWord = null;
        }
        
        // If clicking a different word (case-insensitive), reset to first occurrence
        const wordLower = word.toLowerCase();
        const currentLower = this.currentWord ? this.currentWord.toLowerCase() : null;
        
        if (currentLower !== wordLower) {
            this.currentWord = word;
            this.currentOccurrenceIndex = 0;
            this.matchingSpans = [];
        } else {
            // Same word - go to next occurrence
            this.currentOccurrenceIndex++;
        }
        
        // Scroll to occurrence
        setTimeout(() => {
            const highlightedContent = document.getElementById(targetContentId);
            if (!highlightedContent) return;
            
            // Build list of matching elements if not already done
            if (this.matchingSpans.length === 0) {
                // Remove any previous search highlights
                const oldHighlights = highlightedContent.querySelectorAll('.search-highlight');
                oldHighlights.forEach(el => {
                    const parent = el.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(el.textContent), el);
                        parent.normalize(); // Merge adjacent text nodes
                    }
                });
                
                // Find all occurrences using a more comprehensive approach
                this.findAndWrapText(highlightedContent, word);
            }
            
            // If no matches found, exit
            if (this.matchingSpans.length === 0) {
                console.log('No matches found for:', word);
                return;
            }
            
            // Cycle back to first occurrence if we've gone past the last one
            if (this.currentOccurrenceIndex >= this.matchingSpans.length) {
                this.currentOccurrenceIndex = 0;
            }
            
            // Show navigation bar
            this.showNavigationBar();
            
            // Scroll to current occurrence
            this.scrollToCurrentOccurrence();
            
        }, 300); // Increased delay to ensure view transition is complete
    }
    
    findAndWrapText(container, searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const regex = new RegExp(this.escapeRegex(searchTerm), 'gi');
        
        // Use TreeWalker to find all text nodes
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(searchLower)) {
                textNodes.push(node);
            }
        }
        
        // Process each text node and wrap matches
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const parent = textNode.parentNode;
            
            // Skip if parent is already a search highlight
            if (parent.classList && parent.classList.contains('search-highlight')) {
                return;
            }
            
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            
            regex.lastIndex = 0; // Reset regex
            
            while ((match = regex.exec(text)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.substring(lastIndex, match.index))
                    );
                }
                
                // Wrap the match
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = match[0];
                fragment.appendChild(mark);
                this.matchingSpans.push(mark);
                
                lastIndex = regex.lastIndex;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
                fragment.appendChild(
                    document.createTextNode(text.substring(lastIndex))
                );
            }
            
            // Replace the original text node with the fragment
            if (fragment.childNodes.length > 0) {
                parent.replaceChild(fragment, textNode);
            }
        });
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Stats Panel
const statsPanel = new StatsPanel();

