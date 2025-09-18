// Enhanced Chat Application JavaScript
class EnhancedChat {
    constructor() {
        this.currentContact = 'gaitonde';
        this.isTyping = false;
        this.typingTimeout = null;
        this.messages = this.initializeMessages();
        this.contacts = this.initializeContacts();
        this.defaultExpirySeconds = 300; // 5 minutes
        this.burnAfterReadingEnabled = false;
        this.messageTimers = new Map(); // id -> intervalId
        this.ghostMode = false;
        this.anonymousMode = false;
        this.decoyMode = false;
        this.sessionInfo = null; // ephemeral session parsed from URL
        this.sessionIdleTimer = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoadingScreen();
        this.simulateAppLoad();
    }

    initializeMessages() {
        return {
            gaitonde: [
                { type: 'received', content: 'Hey there! How are you doing today?', time: '2:28 PM', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
                { type: 'sent', content: "I'm doing great! Just working on some new projects. How about you?", time: '2:29 PM' },
                { type: 'received', content: "That sounds exciting! I'd love to hear more about it sometime.", time: '2:30 PM', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' }
            ],
            bunty: [
                { type: 'received', content: 'Good morning! Ready for today?', time: '9:15 AM', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face' },
                { type: 'sent', content: 'Absolutely! What do you have planned?', time: '9:16 AM' },
                { type: 'received', content: 'Meeting at 2 PM, then coffee?', time: '9:17 AM', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face' },
                { type: 'sent', content: 'Perfect! See you tomorrow!', time: '1:45 PM' }
            ],
            kaleen: [
                { type: 'received', content: 'Business meeting scheduled for 5 PM', time: '12:10 PM', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face' },
                { type: 'sent', content: 'Got it! I\'ll be there on time.', time: '12:12 PM' },
                { type: 'received', content: 'Bring the quarterly reports', time: '12:15 PM', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face' }
            ],
            guddu: [
                { type: 'sent', content: 'Hey, need help with the project?', time: '11:25 AM' },
                { type: 'received', content: 'Yes please! The database connection is acting up.', time: '11:27 AM', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face' },
                { type: 'sent', content: 'I can help you fix that. Let me check the config.', time: '11:28 AM' },
                { type: 'received', content: 'Thanks for the help! You\'re a lifesaver.', time: '11:30 AM', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face' }
            ]
        };
    }

    initializeContacts() {
        return {
            gaitonde: {
                name: 'Gaitonde',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
                status: 'online',
                lastSeen: 'Online'
            },
            bunty: {
                name: 'Bunty',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
                status: 'away',
                lastSeen: 'Last seen 5 minutes ago'
            },
            kaleen: {
                name: 'Kaleen Bhaiya',
                avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop&crop=face',
                status: 'online',
                lastSeen: 'Online'
            },
            guddu: {
                name: 'Guddu Bhaiya',
                avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=50&h=50&fit=crop&crop=face',
                status: 'offline',
                lastSeen: 'Last seen 2 hours ago'
            }
        };
    }

    bindEvents() {
        // Contact switching
        document.querySelectorAll('.contact-item').forEach(contact => {
            contact.addEventListener('click', (e) => {
                this.switchContact(contact.dataset.contact);
            });
        });

        // Message sending
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        sendButton.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Typing indicator
        messageInput.addEventListener('input', () => this.handleTyping());

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Mobile sidebar toggle
        this.addMobileSupport();

        // Expiry controls
        const expirySelect = document.getElementById('expirySelect');
        if (expirySelect) {
            this.defaultExpirySeconds = this.parseExpiryValue(expirySelect.value);
            expirySelect.addEventListener('change', () => {
                const val = expirySelect.value;
                if (val === 'custom') {
                    const secs = this.promptCustomExpirySeconds();
                    if (secs !== null) {
                        this.defaultExpirySeconds = secs;
                    } else {
                        // revert to previous valid selection
                        expirySelect.value = String(this.defaultExpirySeconds);
                    }
                } else {
                    this.defaultExpirySeconds = this.parseExpiryValue(val);
                }
            });
        }

        // Burn after reading toggle
        const burnToggle = document.getElementById('burnAfterRead');
        if (burnToggle) {
            this.burnAfterReadingEnabled = !!burnToggle.checked;
            burnToggle.addEventListener('change', () => {
                this.burnAfterReadingEnabled = !!burnToggle.checked;
            });
        }

        // Settings modal
        const openSettingsBtn = document.getElementById('openSettingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (openSettingsBtn && settingsModal && closeSettingsBtn) {
            openSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('open');
                settingsModal.setAttribute('aria-hidden', 'false');
            });
            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('open');
                settingsModal.setAttribute('aria-hidden', 'true');
            });
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('open');
                    settingsModal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        // Toggles
        const ghostToggle = document.getElementById('ghostModeToggle');
        const anonToggle = document.getElementById('anonymousModeToggle');
        const decoyToggle = document.getElementById('decoyModeToggle');
        const watermarkToggle = document.getElementById('watermarkToggle');
        const themeSelect = document.getElementById('themeSelect');
        if (ghostToggle) ghostToggle.addEventListener('change', () => this.setGhostMode(ghostToggle.checked));
        if (anonToggle) anonToggle.addEventListener('change', () => this.setAnonymousMode(anonToggle.checked));
        if (decoyToggle) decoyToggle.addEventListener('change', () => this.setDecoyMode(decoyToggle.checked));
        if (watermarkToggle) watermarkToggle.addEventListener('change', () => this.setWatermark(watermarkToggle.checked));
        if (themeSelect) {
            // Load persisted theme (session only per zero-persistence)
            const saved = sessionStorage.getItem('theme') || 'professional';
            themeSelect.value = saved === 'professional' ? 'professional' : saved;
            this.applyTheme(saved);
            themeSelect.addEventListener('change', () => {
                const val = themeSelect.value;
                this.applyTheme(val);
                sessionStorage.setItem('theme', val);
            });
        }

        // Initialize watermark default
        this.setWatermark(true);

        // Initialize secure link chat flow
        this.initCreateChatModal();
        this.parseSessionFromUrl();
        this.bindSessionControls();
        this.setupIdleAndUnloadDestruction();
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
    }

    simulateAppLoad() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }

    switchContact(contactId) {
        // Update active contact
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-contact="${contactId}"]`).classList.add('active');

        // Update current contact
        this.currentContact = contactId;
        const contact = this.contacts[contactId];

        // Update chat header
        document.getElementById('currentContactName').textContent = contact.name;
        document.getElementById('currentContactAvatar').src = contact.avatar;
        const statusEl = document.getElementById('currentContactStatus');
        const lastSeenEl = document.getElementById('lastSeen');
        statusEl.className = `status-indicator ${this.ghostMode ? 'offline' : contact.status}`;
        lastSeenEl.textContent = this.ghostMode ? 'Last seen hidden' : contact.lastSeen;

        // Load messages with animation
        this.loadMessages(contactId);

        // Simulate contact switching animation
        const chatArea = document.querySelector('.chat-area');
        chatArea.style.opacity = '0';
        chatArea.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            chatArea.style.opacity = '1';
            chatArea.style.transform = 'translateX(0)';
        }, 150);
    }

    setGhostMode(enabled) {
        this.ghostMode = enabled;
        // Update header status text
        const statusEl = document.getElementById('currentContactStatus');
        const lastSeenEl = document.getElementById('lastSeen');
        const contact = this.contacts[this.currentContact];
        statusEl.className = `status-indicator ${enabled ? 'offline' : contact.status}`;
        lastSeenEl.textContent = enabled ? 'Last seen hidden' : contact.lastSeen;
    }

    setAnonymousMode(enabled) {
        this.anonymousMode = enabled;
        const nameEl = document.querySelector('.user-info h3');
        if (nameEl) nameEl.textContent = enabled ? 'Anonymous' : 'You';
        const avatarEl = document.querySelector('.user-profile .avatar img');
        if (avatarEl) avatarEl.style.filter = enabled ? 'blur(6px) grayscale(80%)' : 'none';
    }

    setDecoyMode(enabled) {
        this.decoyMode = enabled;
        if (enabled) {
            // Replace with minimal fake contacts/messages (front-end only mock)
            this.messages.__backup = this.messages;
            this.contacts.__backup = this.contacts;
            this.contacts = {
                alpha: { name: 'Alpha', avatar: 'https://picsum.photos/seed/a/50', status: 'online', lastSeen: 'Online' },
                beta: { name: 'Beta', avatar: 'https://picsum.photos/seed/b/50', status: 'away', lastSeen: 'Last seen 10m ago' }
            };
            this.messages = {
                alpha: [{ type: 'received', content: 'This is a decoy conversation.', time: this.getCurrentTime(), avatar: this.contacts.alpha.avatar }],
                beta: [{ type: 'received', content: 'Nothing to see here.', time: this.getCurrentTime(), avatar: this.contacts.beta.avatar }]
            };
            this.currentContact = 'alpha';
            // Update UI pieces that rely on static DOM in sidebar (simple approach: reload page section)
            // For this lightweight demo, just switch header and messages.
            document.getElementById('currentContactName').textContent = this.contacts.alpha.name;
            document.getElementById('currentContactAvatar').src = this.contacts.alpha.avatar;
            this.loadMessages('alpha');
        } else {
            // Restore
            if (this.messages.__backup && this.contacts.__backup) {
                this.messages = this.messages.__backup;
                this.contacts = this.contacts.__backup;
                delete this.messages.__backup;
                delete this.contacts.__backup;
                this.switchContact('gaitonde');
            }
        }
    }

    setWatermark(enabled) {
        const chatArea = document.querySelector('.chat-area');
        if (!chatArea) return;
        let overlay = chatArea.querySelector('.watermark-overlay');
        if (enabled) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'watermark-overlay';
                chatArea.appendChild(overlay);
            }
        } else {
            if (overlay) overlay.remove();
        }
    }

    applyTheme(name) {
        const root = document.documentElement;
        root.classList.remove('theme-dark', 'theme-light', 'theme-professional');
        switch (name) {
            case 'dark':
                root.classList.add('theme-dark');
                break;
            case 'light':
                root.classList.add('theme-light');
                break;
            case 'professional':
            default:
                root.classList.add('theme-professional');
                break;
        }
    }

    initCreateChatModal() {
        const openBtn = document.getElementById('openCreateChatBtn');
        const modal = document.getElementById('createChatModal');
        const closeBtn = document.getElementById('closeCreateChatBtn');
        const createExpiry = document.getElementById('createExpiry');
        const createPassword = document.getElementById('createPassword');
        const createSingleUse = document.getElementById('createSingleUse');
        const generateBtn = document.getElementById('generateLinkBtn');
        const linkInput = document.getElementById('generatedLink');
        const copyBtn = document.getElementById('copyLinkBtn');
        const openLinkBtn = document.getElementById('openLinkBtn');
        const qrCanvas = document.getElementById('qrCanvas');

        if (!openBtn || !modal || !closeBtn) return;
        openBtn.addEventListener('click', () => {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
        });
        const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        if (createExpiry) createExpiry.addEventListener('change', () => {
            if (createExpiry.value === 'custom') {
                const m = prompt('Custom expiry (minutes):', '60');
                if (m !== null) {
                    const secs = Math.max(0, Math.round(parseFloat(m) * 60 || 0));
                    createExpiry.dataset.custom = String(secs);
                } else {
                    createExpiry.value = '3600';
                }
            }
        });

        const makeLink = async () => {
            const expiry = createExpiry.value === 'custom' ? parseInt(createExpiry.dataset.custom || '3600', 10) : parseInt(createExpiry.value, 10);
            const singleUse = !!createSingleUse.checked;
            const password = (createPassword.value || '').trim();
            const token = this.generateSecureToken();
            const createdAt = Date.now();
            const room = this.generateSecureToken(8);
            let ph = '';
            if (password) {
                ph = await this.hashSHA256(password);
            }
            const payload = { r: room, t: token, e: expiry, s: singleUse ? 1 : 0, p: password ? 1 : 0, ph, c: createdAt };
            const encoded = btoa(JSON.stringify(payload));
            const url = `${location.origin}${location.pathname}#session=${encoded}`;
            if (linkInput) linkInput.value = url;
            this.drawSimpleQR(qrCanvas, url);
            return url;
        };

        if (generateBtn) generateBtn.addEventListener('click', () => { makeLink(); });
        if (copyBtn) copyBtn.addEventListener('click', async () => {
            if (!linkInput || !linkInput.value) return;
            try { await navigator.clipboard.writeText(linkInput.value); } catch {}
        });
        if (openLinkBtn) openLinkBtn.addEventListener('click', () => {
            if (!linkInput || !linkInput.value) return;
            window.open(linkInput.value, '_blank');
        });
    }

    drawSimpleQR(canvas, text) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        let hash = 0;
        for (let i=0; i<text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
        for (let y=0; y<32; y++) {
            for (let x=0; x<32; x++) {
                const bit = (hash >> ((x + y) % 31)) & 1;
                ctx.fillStyle = bit ? '#111' : '#eee';
                ctx.fillRect(x*4, y*4, 4, 4);
            }
        }
    }

    generateSecureToken(len = 16) {
        const bytes = new Uint8Array(len);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async hashSHA256(text) {
        const enc = new TextEncoder();
        const data = enc.encode(text);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async parseSessionFromUrl() {
        const hash = location.hash || '';
        const m = hash.match(/#session=([^&]+)/);
        if (!m) return;
        try {
            const payload = JSON.parse(atob(m[1]));
            const now = Date.now();
            const expiresAt = payload.c + payload.e * 1000;
            if (now >= expiresAt) {
                alert('This secure chat link has expired.');
                location.hash = '';
                return;
            }
            this.sessionInfo = {
                room: payload.r,
                token: payload.t,
                expiresAt,
                singleUse: !!payload.s,
                passwordProtected: !!payload.p,
                passwordHash: payload.ph || '',
                joinedAt: now
            };
            // Single-use enforcement
            if (this.sessionInfo.singleUse) {
                const usedKey = `used_${this.sessionInfo.room}`;
                if (sessionStorage.getItem(usedKey)) {
                    alert('This single-use link has already been used.');
                    location.hash = '';
                    return;
                }
                sessionStorage.setItem(usedKey, '1');
            }
            // Password prompt
            if (this.sessionInfo.passwordProtected) {
                const input = prompt('Enter chat password:');
                const inputHash = input ? await this.hashSHA256(input) : '';
                if (!input || inputHash !== this.sessionInfo.passwordHash) {
                    alert('Incorrect password.');
                    location.hash = '';
                    return;
                }
            }
            const bar = document.getElementById('sessionStatus');
            if (bar) {
                bar.setAttribute('aria-hidden', 'false');
            }
            this.startSessionTimer();
            this.initParticipantPresence();
        } catch {}
    }

    initParticipantPresence() {
        try {
            this.bc && this.bc.close();
        } catch {}
        const room = this.sessionInfo?.room || 'default';
        this.bc = new BroadcastChannel(`room_${room}`);
        this.participants = new Set();
        const id = this.generateSecureToken(6);
        const updateUI = () => {
            const el = document.getElementById('participantCount');
            if (el) el.textContent = `${Math.max(1, this.participants.size)} participant${Math.max(1, this.participants.size) > 1 ? 's' : ''}`;
        };
        this.bc.onmessage = (e) => {
            const { type, sender } = e.data || {};
            if (!sender || sender === id) return;
            if (type === 'hello') this.participants.add(sender);
            if (type === 'bye') this.participants.delete(sender);
            updateUI();
        };
        // announce presence
        this.bc.postMessage({ type: 'hello', sender: id });
        window.addEventListener('beforeunload', () => {
            try { this.bc.postMessage({ type: 'bye', sender: id }); this.bc.close(); } catch {}
        });
        updateUI();
    }

    startSessionTimer() {
        const el = document.getElementById('sessionTimer');
        if (!el || !this.sessionInfo) return;
        const tick = () => {
            if (!this.sessionInfo) return;
            const remaining = Math.max(0, Math.floor((this.sessionInfo.expiresAt - Date.now()) / 1000));
            el.textContent = this.formatSeconds(remaining);
            if (remaining <= 0) this.destroySession('expired');
        };
        tick();
        this.sessionTimerInterval && clearInterval(this.sessionTimerInterval);
        this.sessionTimerInterval = setInterval(tick, 1000);
    }

    bindSessionControls() {
        const panic = document.getElementById('panicBtn');
        if (panic) panic.addEventListener('click', () => this.destroySession('panic'));
    }

    setupIdleAndUnloadDestruction() {
        const resetIdle = () => {
            if (this.sessionIdleTimer) clearTimeout(this.sessionIdleTimer);
            this.sessionIdleTimer = setTimeout(() => this.destroySession('idle'), 15 * 60 * 1000);
        };
        ['click','keypress','mousemove','scroll','touchstart'].forEach(evt => document.addEventListener(evt, resetIdle));
        resetIdle();
        window.addEventListener('beforeunload', () => {
            this.destroySession('unload');
        });
    }

    destroySession(reason) {
        const container = document.getElementById('messagesContainer');
        if (container) container.innerHTML = '';
        this.messages = {};
        for (const id of this.messageTimers.keys()) this.stopCountdown(id);
        this.sessionInfo = null;
        const bar = document.getElementById('sessionStatus');
        if (bar) bar.setAttribute('aria-hidden', 'true');
        if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);
        if (reason !== 'expired') location.hash = '';
    }

    loadMessages(contactId) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messages = this.messages[contactId] || [];
        
        // Clear existing messages
        messagesContainer.innerHTML = '';
        
        // Add messages with staggered animation
        messages.forEach((message, index) => {
            setTimeout(() => {
                this.addMessageToDOM(message);
            }, index * 100);
        });
    }

    addMessageToDOM(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;
        if (!message.id) {
            message.id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
        messageElement.dataset.messageId = message.id;
        
        let avatarHTML = '';
        if (message.type === 'received' && message.avatar) {
            avatarHTML = `
                <div class="message-avatar">
                    <img src="${message.avatar}" alt="Avatar">
                </div>
            `;
        }
        
        let statusHTML = '';
        if (message.type === 'sent') {
            statusHTML = '<i class="message-status fas fa-check-double"></i>';
        }
        
        let timerBadgeHTML = '';
        if (message.expiryAt) {
            const remaining = Math.max(0, Math.floor((message.expiryAt - Date.now()) / 1000));
            timerBadgeHTML = `<span class="timer-badge" data-remaining="${remaining}">${this.formatSeconds(remaining)}</span>`;
        }
        
        messageElement.innerHTML = `
            ${avatarHTML}
            <div class="message-content">
                <div class="message-bubble">
                    <p>${message.content}</p>
                    <span class="message-time">${message.time}</span>
                    ${timerBadgeHTML}
                    ${statusHTML}
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // Setup burn-after-reading
        if (message.burnAfterRead) {
            const bubble = messageElement.querySelector('.message-bubble');
            bubble.addEventListener('click', () => {
                // Burn immediately on user interaction
                this.destroyMessage(message);
            }, { once: true });
        }

        // Setup expiry countdown if configured
        if (message.expiryAt) {
            this.startCountdown(message);
        }
        this.scrollToBottom();
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        // Create message object
        const message = {
            type: 'sent',
            content: content,
            time: this.getCurrentTime(),
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            contactId: this.currentContact
        };
        
        // Apply expiry if set
        if (this.defaultExpirySeconds > 0) {
            message.expiryAt = Date.now() + this.defaultExpirySeconds * 1000;
        }
        
        // Apply burn-after-reading if enabled
        if (this.burnAfterReadingEnabled) {
            message.burnAfterRead = true;
        }
        
        // Add to messages array
        if (!this.messages[this.currentContact]) {
            this.messages[this.currentContact] = [];
        }
        this.messages[this.currentContact].push(message);
        
        // Add to DOM with animation
        this.addMessageToDOM(message);
        
        // Clear input
        messageInput.value = '';
        
        // Simulate send button animation
        const sendButton = document.getElementById('sendButton');
        sendButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            sendButton.style.transform = 'scale(1)';
        }, 150);
        
        // Offer recall for 30s
        this.offerRecall(message);

        // Simulate typing response
        this.simulateTypingResponse();
    }

    startCountdown(message) {
        const id = message.id;
        // Clear any existing timer for this message
        this.stopCountdown(id);
        const tick = () => {
            const el = document.querySelector(`.message[data-message-id="${id}"] .timer-badge`);
            if (!el) {
                this.stopCountdown(id);
                return;
            }
            const remaining = Math.max(0, Math.floor((message.expiryAt - Date.now()) / 1000));
            el.textContent = this.formatSeconds(remaining);
            el.dataset.remaining = String(remaining);
            // Color transition as it nears zero
            if (remaining <= 10) {
                el.classList.add('danger');
            } else if (remaining <= 60) {
                el.classList.add('warning');
            }
            if (remaining <= 0) {
                this.stopCountdown(id);
                this.destroyMessage(message);
            }
        };
        tick();
        const intervalId = setInterval(tick, 1000);
        this.messageTimers.set(id, intervalId);
    }

    offerRecall(message) {
        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.innerHTML = `Message sent. <button class="undo-btn">Undo</button>`;
        document.body.appendChild(toast);

        let recalled = false;
        const timeout = setTimeout(() => {
            if (!recalled) toast.remove();
        }, 30000);

        toast.querySelector('.undo-btn').addEventListener('click', () => {
            recalled = true;
            clearTimeout(timeout);
            this.destroyMessage(message);
            toast.remove();
        }, { once: true });
    }

    stopCountdown(id) {
        if (this.messageTimers.has(id)) {
            clearInterval(this.messageTimers.get(id));
            this.messageTimers.delete(id);
        }
    }

    destroyMessage(message) {
        const id = message.id;
        const elem = document.querySelector(`.message[data-message-id="${id}"]`);
        this.stopCountdown(id);
        if (elem) {
            elem.classList.add('burning');
            // Remove after animation
            setTimeout(() => {
                elem.remove();
            }, 600);
        }
        // Remove from memory
        const contactId = message.contactId || this.currentContact;
        const list = this.messages[contactId] || [];
        const idx = list.findIndex(m => m.id === id);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    }

    formatSeconds(total) {
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    parseExpiryValue(val) {
        if (val === 'custom') return this.defaultExpirySeconds;
        const n = parseInt(val, 10);
        return Number.isFinite(n) ? n : 0;
    }

    promptCustomExpirySeconds() {
        const input = prompt('Set custom expiry (in minutes, e.g., 5, 60, 1440):', '10');
        if (input === null) return null;
        const mins = parseFloat(input);
        if (!Number.isFinite(mins) || mins < 0) return null;
        return Math.round(mins * 60);
    }

    simulateTypingResponse() {
        setTimeout(() => {
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addAutoResponse();
            }, 2000);
        }, 1000);
    }

    addAutoResponse() {
        const responses = [
            "That's interesting! Tell me more.",
            "I completely agree with you.",
            "Thanks for sharing that!",
            "That sounds great!",
            "I'll think about it.",
            "Absolutely! Let's do it.",
            "That makes perfect sense.",
            "I appreciate your input."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const contact = this.contacts[this.currentContact];
        
        const message = {
            type: 'received',
            content: randomResponse,
            time: this.getCurrentTime(),
            avatar: contact.avatar
        };
        
        this.messages[this.currentContact].push(message);
        this.addMessageToDOM(message);
        
        // Update last message in contact list
        this.updateContactLastMessage(this.currentContact, randomResponse);
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        const lastSeen = document.getElementById('lastSeen');
        
        typingIndicator.classList.add('active');
        lastSeen.style.display = 'none';
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        const lastSeen = document.getElementById('lastSeen');
        
        typingIndicator.classList.remove('active');
        lastSeen.style.display = 'block';
    }

    handleTyping() {
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Set typing state
        this.isTyping = true;
        
        // Clear typing state after 1 second of inactivity
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, 1000);
    }

    handleSearch(query) {
        const contacts = document.querySelectorAll('.contact-item');
        
        contacts.forEach(contact => {
            const name = contact.querySelector('h4').textContent.toLowerCase();
            const lastMessage = contact.querySelector('.last-message').textContent.toLowerCase();
            
            if (name.includes(query.toLowerCase()) || lastMessage.includes(query.toLowerCase())) {
                contact.style.display = 'flex';
                contact.style.opacity = '1';
                contact.style.transform = 'translateX(0)';
            } else {
                contact.style.opacity = '0';
                contact.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    if (contact.style.opacity === '0') {
                        contact.style.display = 'none';
                    }
                }, 300);
            }
        });
    }

    updateContactLastMessage(contactId, message) {
        const contactElement = document.querySelector(`[data-contact="${contactId}"]`);
        if (contactElement) {
            const lastMessageElement = contactElement.querySelector('.last-message');
            const timeElement = contactElement.querySelector('.message-time');
            
            lastMessageElement.textContent = message;
            timeElement.textContent = this.getCurrentTime();
            
            // Add notification badge animation
            let badge = contactElement.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'notification-badge';
                badge.textContent = '1';
                contactElement.appendChild(badge);
            } else {
                const count = parseInt(badge.textContent) + 1;
                badge.textContent = count.toString();
            }
            
            // Animate badge
            badge.style.animation = 'none';
            setTimeout(() => {
                badge.style.animation = 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
        }
    }

    addMobileSupport() {
        // Add mobile menu toggle if needed
        if (window.innerWidth <= 768) {
            const chatHeader = document.querySelector('.chat-header');
            const menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-btn action-btn';
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            menuButton.style.order = '-1';
            menuButton.style.marginRight = '12px';
            
            menuButton.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
            });
            
            chatHeader.querySelector('.chat-actions').prepend(menuButton);
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    // Advanced features
    addEmojiSupport() {
        const emojiButton = document.querySelector('.input-action-btn[title="Emoji"]');
        emojiButton.addEventListener('click', () => {
            // Simple emoji picker simulation
            const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const messageInput = document.getElementById('messageInput');
            messageInput.value += randomEmoji;
            messageInput.focus();
        });
    }

    addFileAttachment() {
        const attachButton = document.querySelector('.input-action-btn[title="Attach File"]');
        attachButton.addEventListener('click', () => {
            // Simulate file attachment
            const fileTypes = ['Document.pdf', 'Image.jpg', 'Presentation.pptx'];
            const randomFile = fileTypes[Math.floor(Math.random() * fileTypes.length)];
            
            const message = {
                type: 'sent',
                content: `📎 ${randomFile}`,
                time: this.getCurrentTime()
            };
            
            this.messages[this.currentContact].push(message);
            this.addMessageToDOM(message);
        });
    }

    addVoiceCallSimulation() {
        const voiceButton = document.querySelector('.chat-actions .action-btn[title="Voice Call"]');
        voiceButton.addEventListener('click', () => {
            this.showCallNotification('Voice call started...');
        });
    }

    addVideoCallSimulation() {
        const videoButton = document.querySelector('.chat-actions .action-btn[title="Video Call"]');
        videoButton.addEventListener('click', () => {
            this.showCallNotification('Video call started...');
        });
    }

    showCallNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(66, 133, 244, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize advanced features
    initAdvancedFeatures() {
        this.addEmojiSupport();
        this.addFileAttachment();
        this.addVoiceCallSimulation();
        this.addVideoCallSimulation();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const chat = new EnhancedChat();
    
    // Initialize advanced features after a delay
    setTimeout(() => {
        chat.initAdvancedFeatures();
    }, 2500);
    
    // Add some dynamic effects
    setTimeout(() => {
        // Simulate incoming message
        const incomingMessage = {
            type: 'received',
            content: 'Welcome to Enhanced Chat! 🎉',
            time: chat.getCurrentTime(),
            avatar: chat.contacts[chat.currentContact].avatar
        };
        
        chat.messages[chat.currentContact].push(incomingMessage);
        chat.addMessageToDOM(incomingMessage);
    }, 4000);
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .mobile-menu-btn {
        display: none;
    }
    
    @media (max-width: 768px) {
        .mobile-menu-btn {
            display: flex !important;
        }
    }
`;
document.head.appendChild(style);
