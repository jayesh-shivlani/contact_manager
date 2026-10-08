document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('contactDialog');
    const addContactBtn = document.getElementById('addContactBtn');
    const closeDialogBtn = document.getElementById('closeDialogBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const contactForm = document.getElementById('contactForm');
    const contactsBody = document.getElementById('contactsBody');
    const emptyState = document.getElementById('emptyState');
    const contactsTable = document.getElementById('contactsTable');
    const dialogTitle = document.getElementById('dialogTitle');
    const contactIdInput = document.getElementById('contactId');
    const toastContainer = document.getElementById('toastContainer');
    const searchInput = document.getElementById('searchInput');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const countBadge = document.getElementById('countBadge');

    const showPhoneError = (msg) => {
        phoneError.textContent = msg;
        phoneError.classList.add('visible');
        phoneInput.focus();
    };

    const clearPhoneError = () => {
        phoneError.textContent = '';
        phoneError.classList.remove('visible');
    };

    let allContacts = [];
    let sortState = { column: null, direction: 'asc' }; // Track current sort

    // ---- Phone: allow only digits, max 10 ----
    phoneInput.addEventListener('keydown', (e) => {
        // Allow: backspace, delete, tab, escape, enter, arrow keys
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                             'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) return;
        // Block anything that's not a digit
        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    });

    // Also strip any pasted non-numeric content
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        clearPhoneError(); // clear error as user types
    });

    // ---- Custom confirm dialog (returns a Promise) ----
    const showConfirm = (message = 'This action cannot be undone.') => {
        document.getElementById('confirmMessage').textContent = message;
        confirmDialog.showModal();
        return new Promise((resolve) => {
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            const onBackdrop = (e) => { if (e.target === confirmDialog) { cleanup(); resolve(false); } };
            function cleanup() {
                confirmDialog.close();
                confirmOkBtn.removeEventListener('click', onOk);
                confirmCancelBtn.removeEventListener('click', onCancel);
                confirmDialog.removeEventListener('click', onBackdrop);
            }
            confirmOkBtn.addEventListener('click', onOk);
            confirmCancelBtn.addEventListener('click', onCancel);
            confirmDialog.addEventListener('click', onBackdrop);
        });
    };

    // Light dismiss for dialog
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.close();
        }
    });

    // Open Add Dialog
    addContactBtn.addEventListener('click', () => {
        dialogTitle.textContent = 'Add Contact';
        contactForm.reset();
        contactIdInput.value = '';
        clearPhoneError();
        dialog.showModal();
    });

    // Close Dialog
    const closeDialog = () => dialog.close();
    closeDialogBtn.addEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);

    // Toast functionality
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    };

    // Avatar generation
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#ec4899', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Formatting date
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // ---- Update Count Badge ----
    const updateCountBadge = (total) => {
        countBadge.textContent = total;
        countBadge.title = `${total} contact${total !== 1 ? 's' : ''} total`;
    };

    // ---- Sort Logic ----
    const sortContacts = (contacts, column, direction) => {
        return [...contacts].sort((a, b) => {
            let valA = a[column] ?? '';
            let valB = b[column] ?? '';
            if (column === 'name') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            } else if (column === 'last_modified') {
                valA = new Date(valA);
                valB = new Date(valB);
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const updateSortHeaders = () => {
        document.querySelectorAll('th.sortable').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            const col = th.getAttribute('data-sort');
            th.classList.remove('sort-asc', 'sort-desc');
            icon.className = 'fa-solid fa-sort sort-icon'; // reset
            if (col === sortState.column) {
                th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                icon.className = `fa-solid fa-sort-${sortState.direction === 'asc' ? 'up' : 'down'} sort-icon active`;
            }
        });
    };

    // Click handler for sortable headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            if (sortState.column === col) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = col;
                sortState.direction = 'asc';
            }
            updateSortHeaders();
            // Re-render with current search filter + new sort
            const query = searchInput.value.toLowerCase();
            let list = query
                ? allContacts.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    c.phone.toLowerCase().includes(query) ||
                    (c.email && c.email.toLowerCase().includes(query)))
                : [...allContacts];
            renderContacts(sortContacts(list, sortState.column, sortState.direction));
        });
    });

    // Render table
    const renderContacts = (contacts) => {
        contactsBody.innerHTML = '';
        updateCountBadge(allContacts.length); // always show total, not filtered count
        
        if (contacts.length === 0) {
            emptyState.classList.remove('hidden');
            contactsTable.style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            contactsTable.style.display = 'table';
            
            contacts.forEach((contact, index) => {
                const tr = document.createElement('tr');
                tr.style.animationDelay = `${index * 0.05}s`;
                
                const initials = getInitials(contact.name);
                const bgColor = getAvatarColor(contact.name);
                const favClass = contact.is_favorite ? 'favorited' : '';
                const favIcon = contact.is_favorite ? 'fa-solid' : 'fa-regular';
                
                tr.innerHTML = `
                    <td>
                        <div class="contact-name-cell">
                            <div class="avatar" style="background-color: ${bgColor}">${initials}</div>
                            <div style="font-weight: 500;">${escapeHTML(contact.name)}</div>
                        </div>
                    </td>
                    <td>${escapeHTML(contact.phone)}</td>
                    <td>${escapeHTML(contact.email || '-')}</td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">${formatDate(contact.last_modified)}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-star ${favClass}" data-id="${contact.id}" data-action="favorite" title="Favorite">
                            <i class="${favIcon} fa-star"></i>
                        </button>
                        <button class="btn-icon edit-btn" data-id="${contact.id}" data-action="edit" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete delete-btn" data-id="${contact.id}" data-action="delete" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                contactsBody.appendChild(tr);
            });
        }
    };

    // Fetch contacts
    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to fetch');
            allContacts = await res.json();

            // Apply current sort if any
            let list = sortState.column
                ? sortContacts(allContacts, sortState.column, sortState.direction)
                : allContacts;

            // Re-apply search filter
            if (searchInput.value) {
                const query = searchInput.value.toLowerCase();
                list = list.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    c.phone.toLowerCase().includes(query) ||
                    (c.email && c.email.toLowerCase().includes(query)));
            }

            renderContacts(list);
        } catch (error) {
            showToast('Error loading contacts', 'error');
            console.error(error);
        }
    };

    // Search functionality
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        let list = allContacts.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query) ||
            (c.email && c.email.toLowerCase().includes(query))
        );
        if (sortState.column) {
            list = sortContacts(list, sortState.column, sortState.direction);
        }
        renderContacts(list);
    };
    
    searchInput.addEventListener('input', handleSearch);

    // Event Delegation for Table Actions
    contactsBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const contact = allContacts.find(c => c.id == id);
        
        if (!contact) return;

        if (action === 'edit') {
            dialogTitle.textContent = 'Edit Contact';
            document.getElementById('name').value = contact.name;
            document.getElementById('phone').value = contact.phone;
            document.getElementById('email').value = contact.email || '';
            contactIdInput.value = id;
            clearPhoneError();
            dialog.showModal();
        } 
        else if (action === 'delete') {
            const confirmed = await showConfirm(`Are you sure you want to delete "${contact.name}"?`);
            if (confirmed) {
                try {
                    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('Contact deleted successfully');
                        fetchContacts();
                    } else {
                        throw new Error('Failed to delete');
                    }
                } catch (error) {
                    showToast('Error deleting contact', 'error');
                }
            }
        }
        else if (action === 'favorite') {
            try {
                const newStatus = !contact.is_favorite;
                const res = await fetch(`/api/contacts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_favorite: newStatus })
                });
                if (res.ok) {
                    showToast(newStatus ? 'Added to favorites' : 'Removed from favorites');
                    fetchContacts();
                } else {
                    throw new Error('Failed to update favorite status');
                }
            } catch (error) {
                showToast('Error updating favorite', 'error');
            }
        }
    });

    // Form submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = contactIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/contacts/${id}` : '/api/contacts';
        
        const enteredPhone = document.getElementById('phone').value;

        // ---- Duplicate Phone Detection ----
        const duplicate = allContacts.find(c => c.phone === enteredPhone && c.id != id);
        if (duplicate) {
            showPhoneError(`⚠️ Already used by "${duplicate.name}"`);
            return; // Stop form submission
        }

        // Find existing to preserve favorite status during edit
        const existingContact = allContacts.find(c => c.id == id);
        
        const data = {
            name: document.getElementById('name').value,
            phone: enteredPhone,
            email: document.getElementById('email').value,
            is_favorite: existingContact ? existingContact.is_favorite : false
        };
        
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                dialog.close();
                clearPhoneError();
                showToast(id ? 'Contact updated successfully' : 'Contact added successfully');
                fetchContacts();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showToast('Error saving contact', 'error');
            console.error(error);
        }
    });

    // Utility to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initial fetch
    fetchContacts();
});
