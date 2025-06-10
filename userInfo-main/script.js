// === DEBUG: script.js loaded at top ===
console.log('[DEBUG] script.js loaded (top of file)');

// User data storage - hybrid approach (Firestore + localStorage fallback)
let users = [];
let isLoading = false;

// Data management functions
const DataManager = {
    async loadUsers() {
        isLoading = true;
        console.log('Starting to load users...');
        try {
            if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
                console.log('Firebase is available, loading from Firestore...');
                try {
                    users = await FirebaseHelper.getAllUsers();
                    console.log('Successfully loaded users from Firestore:', users);
                    // Also save to localStorage as backup
                    localStorage.setItem('users', JSON.stringify(users));
                } catch (firebaseError) {
                    console.error('Error with Firestore, falling back to localStorage:', firebaseError);
                    // Fallback to localStorage
                    users = JSON.parse(localStorage.getItem('users')) || [];
                }
            } else {
                console.log('Firebase not available, loading from localStorage...');
                users = JSON.parse(localStorage.getItem('users')) || [];
            }
            console.log('Total users loaded:', users.length);
            console.log('User data sample:', users.slice(0, 2));
        } catch (error) {
            console.error('Critical error loading users:', error);
            // Last resort fallback to localStorage
            try {
                users = JSON.parse(localStorage.getItem('users')) || [];
                console.log('Emergency fallback to localStorage, users:', users.length);
            } catch (localStorageError) {
                console.error('Even localStorage failed:', localStorageError);
                users = [];
            }
        } finally {
            isLoading = false;
        }
        return users;
    },

    async saveUser(userData) {
        try {
            if (FirebaseHelper.isAvailable()) {
                console.log('Saving user to Firestore...');
                const savedUser = await FirebaseHelper.addUser(userData);
                users.push(savedUser);
                // Also save to localStorage as backup
                localStorage.setItem('users', JSON.stringify(users));
                return savedUser;
            } else {
                console.log('Saving user to localStorage...');
                const userWithId = { ...userData, id: generateUserId() };
                users.push(userWithId);
                localStorage.setItem('users', JSON.stringify(users));
                return userWithId;
            }
        } catch (error) {
            console.error('Error saving user:', error);
            // Fallback to localStorage
            const userWithId = { ...userData, id: generateUserId() };
            users.push(userWithId);
            localStorage.setItem('users', JSON.stringify(users));
            return userWithId;
        }
    },    async updateUser(userId, userData) {
        if (!userId) {
            throw new Error('No user ID provided for update');
        }
        
        console.log('Attempting to update user with ID:', userId);
        
        try {
            if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
                console.log('Updating user in Firestore...');
                await FirebaseHelper.updateUser(userId, userData);
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    users[userIndex] = { ...userData, id: userId };
                    console.log('Updated user in memory:', users[userIndex]);
                } else {
                    console.warn('User not found in memory array for update');
                }
                // Also save to localStorage as backup
                localStorage.setItem('users', JSON.stringify(users));
            } else {
                console.log('Updating user in localStorage...');
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    users[userIndex] = { ...userData, id: userId };
                    localStorage.setItem('users', JSON.stringify(users));
                    console.log('Updated user in localStorage');
                } else {
                    console.warn('User not found in localStorage for update');
                }
            }
        } catch (error) {
            console.error('Error updating user:', error);
            // Fallback to localStorage
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = { ...userData, id: userId };
                localStorage.setItem('users', JSON.stringify(users));
                console.log('Updated user in localStorage (fallback)');
            } else {
                console.warn('User not found in localStorage for fallback update');
            }
        }
    },    async deleteUser(userId) {
        if (!userId) {
            throw new Error('No user ID provided for deletion');
        }
        
        console.log('Attempting to delete user with ID:', userId);
        
        try {
            if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
                console.log('Deleting user from Firestore...');
                await FirebaseHelper.deleteUser(userId);
                users = users.filter(user => user.id !== userId);
                // Also save to localStorage as backup
                localStorage.setItem('users', JSON.stringify(users));
            } else {
                console.log('Deleting user from localStorage...');
                users = users.filter(user => user.id !== userId);
                localStorage.setItem('users', JSON.stringify(users));
            }
            console.log('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            // Fallback to localStorage
            users = users.filter(user => user.id !== userId);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded event fired');
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    console.log('[DEBUG] currentPage:', currentPage);
    console.log('[DEBUG] window.location.pathname:', window.location.pathname);
    console.log('[DEBUG] Users in storage:', users); // Debug log
    if (currentPage === 'index.html' || currentPage === '' || currentPage.includes('index')) {
        console.log('[DEBUG] Running initDashboard');
        initDashboard();
    } else if (currentPage === 'add-user.html' || currentPage.includes('add-user')) {
        console.log('[DEBUG] Running initAddUserPage');
        initAddUserPage();
    } else {
        console.log('[DEBUG] No matching page branch for:', currentPage);
    }
});

// Dashboard functions
async function initDashboard() {
    // Show loading state
    showLoadingState();
    
    try {
        // Load users from Firestore or localStorage
        await DataManager.loadUsers();
        console.log('Dashboard initialized with users:', users);
        updateStats();
        displayUsers();
        
        // Add debug button to help troubleshoot ID issues
        // addDebugButton();
        
        // Initialize search and filter if they exist
        initSearchAndFilter();
        
        // Debug log all user IDs to help troubleshoot
        if (users && users.length > 0) {
            console.log('User IDs for reference:');
            users.forEach(user => console.log(`${user.firstName} ${user.lastName}: ${user.id}`));
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        hideLoadingState();
        showErrorMessage('Failed to load users. Please try refreshing the page.');
        
        // Record error in debug panel if it exists
        const lastErrorEl = document.getElementById('last-error');
        if (lastErrorEl) {
            lastErrorEl.textContent = error.message;
        }
    }
}

function showLoadingState() {
    const userGrid = document.getElementById('userGrid');
    if (userGrid) {
        userGrid.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 20px; color: #3498db;"></i>
                <h3>Loading Users...</h3>
                <p>Connecting to ${typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable ? FirebaseHelper.isAvailable() ? 'Firestore' : 'localStorage' : 'localStorage'}...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayUsers() or error message
}

function showErrorMessage(message) {
    const userGrid = document.getElementById('userGrid');
    if (userGrid) {
        userGrid.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 60px 20px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="initDashboard()" style="margin-top: 20px;">
                    <i class="fas fa-sync"></i> Try Again
                </button>
            </div>
        `;
    }
}

async function refreshDashboard() {
    console.log('Manual refresh triggered');
    await initDashboard();
}

function updateStats() {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
}

function displayUsers() {
    const userGrid = document.getElementById('userGrid');
    const noUsers = document.getElementById('noUsers');
    
    console.log('=== DISPLAY USERS DEBUG ===');
    console.log('Users length:', users.length);
    console.log('Users data:', users);
    console.log('UserGrid element:', userGrid);
    console.log('NoUsers element:', noUsers);
    
    if (!userGrid) {
        console.error('UserGrid element not found!');
        return;
    }
    
    if (users.length === 0) {
        console.log('No users, showing empty state');
        userGrid.innerHTML = `
            <div class="no-users" id="noUsers">
                <i class="fas fa-user-slash"></i>
                <h3>No Users Found</h3>
                <p>Start by adding your first user!</p>
                <button class="btn btn-primary" onclick="location.href='add-user.html'">
                    <i class="fas fa-plus"></i> Add User
                </button>
            </div>
        `;
        return;
    }
    
    console.log('Users found, generating table...');
    
    // Create the table header and prepare the body
    let tableHTML = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Location</th>
                    <th>Occupation</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Generate table rows
    const tableRows = users.map((user, index) => {
        console.log(`Processing user ${index + 1}:`, user);
        
        if (!user.firstName || !user.lastName) {
            console.warn('User missing name:', user);
            return '';
        }
        
        const initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
        const age = calculateAge(user.dateOfBirth);
        
        return `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-name-cell">
                        <div class="user-avatar-sm">${initials}</div>
                        ${user.firstName} ${user.lastName}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${age}</td>
                <td>${user.city || 'N/A'}</td>                <td>
                    ${formatOccupation(user.occupation, user.suboccupation)}
                </td>                <td><span class="badge badge-${user.status}">${user.status}</span></td><td class="actions">
                    <button class="btn btn-edit btn-table" data-user-id="${user.id}" onclick="editUserById(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-table" data-user-id="${user.id}" onclick="deleteUserById(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Complete the table
    tableHTML += tableRows;
    tableHTML += `
            </tbody>
        </table>
    `;
      // Set the table HTML
    userGrid.innerHTML = tableHTML;
    
    // Remove any existing "no results" message
    const noResultsEl = document.getElementById('noResultsMessage');
    if (noResultsEl) {
        noResultsEl.style.display = 'none';
    }
    
    // Apply any active filters if search or filter elements exist
    const searchInput = document.getElementById('userSearch');
    const rankFilter = document.getElementById('rankFilter');
    if (searchInput && rankFilter && (searchInput.value || rankFilter.value !== 'all')) {
        filterUsers();
    }
    
    console.log('UserGrid innerHTML set. New content length:', userGrid.innerHTML.length);
    console.log('=== END DISPLAY USERS DEBUG ===');
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

let userIdToDelete = null;

function openDeleteModal(userId) {
    userIdToDelete = userId;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'flex'; // Show the modal overlay
        modal.classList.add('active');
    } else {
        console.error('Delete confirmation modal not found!');
    }
}

function closeDeleteModal() {
    userIdToDelete = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('active');
        // Wait for animation to finish before hiding
        setTimeout(() => {
            modal.style.display = 'none'; 
        }, 300); // Match CSS transition duration
    } else {
        console.error('Delete confirmation modal not found!');
    }
}

async function confirmActualDelete() {
    if (!userIdToDelete) {
        console.error('No user ID set for deletion.');
        closeDeleteModal();
        return;
    }
    // Call the original delete logic, but pass the stored userIdToDelete
    await deleteUser(userIdToDelete);
    closeDeleteModal();
}

// Modified deleteUser function (original logic without confirm)
async function performDeleteUser(userId) { // Renamed to avoid conflict if we keep old deleteUser for other purposes
    if (!userId) {
        console.error("Invalid user ID for deletion:", userId);
        // alert("Error: Invalid user ID for deletion."); // Alert handled by modal or calling function
        return;
    }
    
    // The confirm dialog is now replaced by the modal
    // if (confirm('Are you sure you want to delete this user?')) { 
    try {
        console.log("Attempting to delete user with ID:", userId);
        await DataManager.deleteUser(userId);
        console.log("User deleted successfully, refreshing dashboard...");
        await initDashboard(); // Refresh the display
    } catch (error) {
        console.error('Error deleting user:', error);
        // Consider showing error in a more user-friendly way than alert
        const errorP = document.querySelector('#deleteConfirmModal .modal-content p');
        if(errorP) errorP.textContent = 'Error deleting user: ' + error.message;
        // alert('Error deleting user: ' + error.message);
    }
}

// This is the function that will be called by the modal's delete button
// It's a wrapper around performDeleteUser to ensure userIdToDelete is used
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (userIdToDelete) {
                await performDeleteUser(userIdToDelete);
                closeDeleteModal();
            } else {
                console.error('User ID for deletion is null.');
                closeDeleteModal();
            }
        };
    }
});

function editUser(userId) {
    // Store user ID for editing and redirect to add user page
    localStorage.setItem('editingUserId', userId);
    window.location.href = 'add-user.html';
}

function editUserById(element) {
    const userId = element.getAttribute('data-user-id');
    if (userId) {
        editUser(userId);
    } else {
        console.error("No user ID found for edit operation");
        alert("Error: Could not find user ID for editing.");
    }
}

function deleteUserById(element) {
    const userId = element.getAttribute('data-user-id');
    if (userId) {
        openDeleteModal(userId); // Show modal instead of direct delete
    } else {
        console.error("No user ID found for delete operation");
        alert("Error: Could not find user ID for deletion.");
    }
}

// Add User page functions
async function initAddUserPage() {
    try {
        console.log('[CRITICAL DEBUG] initAddUserPage called'); // Critical debug log
        const userForm = document.getElementById('userForm');
        if (!userForm) {
            document.body.insertAdjacentHTML('afterbegin', '<div style="background:#e74c3c;color:#fff;padding:16px;text-align:center;font-weight:bold;">Error: User form not found. Please check your HTML structure.</div>');
            return;
        }
        userForm.addEventListener('submit', handleFormSubmit);
        console.log('[CRITICAL DEBUG] Form submit listener added'); // Critical debug log

        // Make sure users data is loaded
        if (users.length === 0) {
            console.log('[CRITICAL DEBUG] Loading users data for edit page');
            await DataManager.loadUsers();
        }

        // Check if we're editing a user and came from the dashboard
        const editingUserId = localStorage.getItem('editingUserId');
        const cameFromDashboard = document.referrer.includes('index.html');

        // Only load user for editing if we explicitly came from dashboard
        // This prevents old editingUserId from being used when directly accessing add-user.html
        if (editingUserId && cameFromDashboard) {
            loadUserForEditing(editingUserId);
        } else {
            // Clear any old editing user ID if we're not intentionally editing
            localStorage.removeItem('editingUserId');
            resetForm();
        }
    } catch (err) {
        document.body.insertAdjacentHTML('afterbegin', `<div style="background:#e74c3c;color:#fff;padding:16px;text-align:center;font-weight:bold;">JS Error: ${err.message}</div>`);
        console.error('[CRITICAL DEBUG] Error initializing add user page:', err);
    }
}

function loadUserForEditing(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        // Update page title
        document.querySelector('.page-header h1').innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
        document.querySelector('.page-header p').textContent = 'Update user information';
        
        // Fill form with user data
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone;
        document.getElementById('dateOfBirth').value = user.dateOfBirth;
        document.getElementById('gender').value = user.gender;
        document.getElementById('address').value = user.address || '';        document.getElementById('city').value = user.city;
        document.getElementById('occupation').value = user.occupation || '';
        document.getElementById('status').value = user.status;
          // Handle the suboccupation dropdown
        if (user.occupation) {
            showSuboccupation();
            // Wait a moment for the suboccupation options to be populated
            setTimeout(() => {
                const suboccupationSelect = document.getElementById('suboccupation');
                if (suboccupationSelect && user.suboccupation) {
                    suboccupationSelect.value = user.suboccupation;
                }
            }, 100);
        }
        
        // Update submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update User';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    console.log('Form submitted!');
    
    // Show loading state on submit button
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(event.target);
        const editingUserId = localStorage.getItem('editingUserId');
          const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            dateOfBirth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            address: formData.get('address'),
            city: formData.get('city'),
            occupation: formData.get('occupation'),
            suboccupation: formData.get('suboccupation') || '',
            status: formData.get('status')
        };
        
        console.log('User data to save:', userData);
        
        // Validate email uniqueness (except for current user when editing)
        const existingUser = users.find(user => user.email === userData.email && user.id !== editingUserId);
        if (existingUser) {
            alert('A user with this email already exists!');
            return;
        }
          if (editingUserId) {
            console.log('Updating existing user with ID:', editingUserId);
            // Update existing user
            await DataManager.updateUser(editingUserId, userData);
            localStorage.removeItem('editingUserId');
        } else {
            console.log('Adding new user');
            // Add new user
            await DataManager.saveUser(userData);
        }
        
        console.log('User saved successfully');
        showSuccessModal();
        
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error saving user: ' + error.message);
    } finally {
        // Restore submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Generate a unique ID for users when not using Firebase
function generateUserId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function resetForm() {
    // Clear the form
    document.getElementById('userForm').reset();
    localStorage.removeItem('editingUserId');
    
    // Reset page title if we were editing
    document.querySelector('.page-header h1').innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
    document.querySelector('.page-header p').textContent = 'Enter user information to add to the system';
    
    // Hide suboccupation if showing
    const suboccupationContainer = document.getElementById('suboccupationContainer');
    if (suboccupationContainer) {
        suboccupationContainer.style.display = 'none';
    }
    
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save User';
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (!modal) {
        console.error('Success modal not found');
        return;
    }
    
    // Set display to flex first, then add active class to trigger animation
    modal.style.display = 'flex';
    // Force browser reflow before adding active class
    void modal.offsetWidth;
    modal.classList.add('active');
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

async function closeModal() {
    const modal = document.getElementById('successModal');
    if (!modal) {
        console.error('Success modal not found');
        return;
    }
    
    // Remove active class first to trigger fade out
    modal.classList.remove('active');
    
    // Wait for animation to finish before hiding
    setTimeout(() => {
        modal.style.display = 'none';
        
        // Reset form after closing modal
        resetForm();
        
        // Reload users data
        DataManager.loadUsers()
            .then(() => console.log('Users reloaded after modal close:', users))
            .catch(err => console.error('Error reloading users:', err));
    }, 300); // Match the transition time from CSS
}

// Function to clear all user data and reset the application
function clearAllUsers() {
    if (confirm('Are you sure you want to clear all user data from localStorage? This cannot be undone.')) {
        try {
            // Clear users array
            users = [];
            
            // Clear localStorage
            localStorage.removeItem('users');
            localStorage.removeItem('editingUserId');
            
            // If Firebase is available, show warning about Firestore
            if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
                alert('Local data cleared. Note: This does NOT delete users from Firestore. Firebase data will reload when you refresh.');
            } else {
                alert('All user data has been cleared from localStorage.');
            }
            
            // Refresh the display
            initDashboard();
        } catch (error) {
            console.error('Error clearing users:', error);
            alert('Error clearing users: ' + error.message);
        }
    }
}

// Force initialization for when normal init fails
function forceInitDashboard() {
    try {
        console.log('Force loading dashboard...');
        // Clear any previous error messages
        const userGrid = document.getElementById('userGrid');
        if (userGrid) {
            userGrid.innerHTML = '';
        }
        
        // Attempt to reload data
        initDashboard();
    } catch (error) {
        console.error('Error in force init:', error);
        alert('Error in force initialization: ' + error.message);
    }
}

// Helper functions for managing users
async function clearAllUsers() {
    if (!window.confirm('Are you sure you want to delete ALL users? This cannot be undone.')) {
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        // Clear from Firebase if available
        if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
            await FirebaseHelper.clearAllUsers();
        }
        
        // Clear from local storage
        localStorage.removeItem('users');
        users = [];
        
        // Refresh dashboard
        await initDashboard();
    } catch (error) {
        console.error('Error clearing users:', error);
        alert('Error clearing users: ' + error.message);
        // Refresh dashboard anyway
        await initDashboard();
    }
}

async function addTestUser() {
    // Show loading state
    showLoadingState();
    
    try {
        // Generate a random test user
        const randomNum = Math.floor(Math.random() * 1000);
        const testUser = {
            firstName: 'Test',
            lastName: `User ${randomNum}`,
            email: `test${randomNum}@example.com`,
            phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            dateOfBirth: `${1970 + Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 12) + 1 < 10 ? '0' + (Math.floor(Math.random() * 12) + 1) : Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1 < 10 ? '0' + (Math.floor(Math.random() * 28) + 1) : Math.floor(Math.random() * 28) + 1}`,
            gender: ['male', 'female', 'other'][Math.floor(Math.random() * 3)],
            address: `${Math.floor(Math.random() * 9000) + 1000} Test Street`,
            city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
            zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            occupation: Math.random() > 0.5 ? 'technical' : 'nonTechnical',
            suboccupation: Math.random() > 0.5 ? 
                (Math.random() > 0.5 ? 'rank3' : 'rank2') : 
                (Math.random() > 0.5 ? 'naqib' : 'rayd'),
            status: Math.random() > 0.3 ? 'active' : 'inactive'
        };
        
        await DataManager.saveUser(testUser);
        await initDashboard();
    } catch (error) {
        console.error('Error adding test user:', error);
        alert('Error adding test user: ' + error.message);
        // Refresh dashboard anyway
        await initDashboard();
    }
}

// Vanilla JS Date Picker Implementation (with year/month dropdowns)
(function() {
    const input = document.getElementById('dateOfBirth');
    const icon = document.getElementById('customDateIcon');
    const calendar = document.getElementById('vanillaDatePicker');
    if (!input || !icon || !calendar) return;

    // Utility functions
    function pad(n) { return n < 10 ? '0' + n : n; }
    function formatDate(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m-1, d);
    }

    // Calendar state
    let selectedDate = input.value ? parseDate(input.value) : null;
    let viewDate = selectedDate || new Date();

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
        const selected = selectedDate;
        // First day of month
        const first = new Date(year, month, 1);
        // Last day of month
        const last = new Date(year, month+1, 0);
        // Weekday of first day (0=Sun)
        const startDay = first.getDay();
        // Days in month
        const daysInMonth = last.getDate();
        // Weekday names
        const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        // Year and month dropdowns
        let minYear = today.getFullYear() - 100;
        let maxYear = today.getFullYear();
        if (selected && selected.getFullYear() < minYear) minYear = selected.getFullYear();
        if (selected && selected.getFullYear() > maxYear) maxYear = selected.getFullYear();
        let yearOptions = '';
        for (let y = maxYear; y >= minYear; y--) {
            yearOptions += `<option value="${y}"${y===year?' selected':''}>${y}</option>`;
        }
        let monthOptions = '';
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        for (let m=0; m<12; m++) {
            monthOptions += `<option value="${m}"${m===month?' selected':''}>${monthNames[m]}</option>`;
        }
        let html = `<div class="vanilla-date-picker-header">
            <button type="button" id="prevMonthBtn">&#8592;</button>
            <select id="yearSelect">${yearOptions}</select>
            <select id="monthSelect">${monthOptions}</select>
            <button type="button" id="nextMonthBtn">&#8594;</button>
        </div>`;
        html += '<div class="vanilla-date-picker-days">';
        for (let wd of weekdays) html += `<div class="vanilla-date-picker-weekday">${wd}</div>`;
        for (let i=0; i<startDay; i++) html += '<div></div>';
        for (let d=1; d<=daysInMonth; d++) {
            const thisDate = new Date(year, month, d);
            let classes = 'vanilla-date-picker-day';
            if (selected && thisDate.toDateString() === selected.toDateString()) classes += ' selected';
            if (thisDate.toDateString() === today.toDateString()) classes += ' today';
            html += `<div class="${classes}" data-date="${formatDate(year,month,d)}">${d}</div>`;
        }
        html += '</div>';
        calendar.innerHTML = html;
        // Month navigation
        calendar.querySelector('#prevMonthBtn').onclick = function(e) {
            e.stopPropagation();
            let newMonth = month-1;
            let newYear = year;
            if (newMonth < 0) { newMonth = 11; newYear--; }
            viewDate = new Date(newYear, newMonth, 1);
            renderCalendar(viewDate);
        };
        calendar.querySelector('#nextMonthBtn').onclick = function(e) {
            e.stopPropagation();
            let newMonth = month+1;
            let newYear = year;
            if (newMonth > 11) { newMonth = 0; newYear++; }
            viewDate = new Date(newYear, newMonth, 1);
            renderCalendar(viewDate);
        };
        // Year/month dropdowns
        calendar.querySelector('#yearSelect').onchange = function(e) {
            viewDate = new Date(Number(this.value), viewDate.getMonth(), 1);
            renderCalendar(viewDate);
        };
        calendar.querySelector('#monthSelect').onchange = function(e) {
            viewDate = new Date(viewDate.getFullYear(), Number(this.value), 1);
            renderCalendar(viewDate);
        };
        // Date selection
        calendar.querySelectorAll('.vanilla-date-picker-day').forEach(dayEl => {
            dayEl.onclick = function(e) {
                e.stopPropagation();
                const val = this.getAttribute('data-date');
                input.value = val;
                selectedDate = parseDate(val);
                hideCalendar();
            };
        });
    }

    function showCalendar() {
        calendar.style.display = 'block';
        renderCalendar(viewDate);
        setTimeout(() => {
            document.addEventListener('mousedown', onDocClick);
        }, 0);
    }
    function hideCalendar() {
        calendar.style.display = 'none';
        document.removeEventListener('mousedown', onDocClick);
    }
    function onDocClick(e) {
        if (!calendar.contains(e.target) && e.target !== input && e.target !== icon) {
            hideCalendar();
        }
    }
    input.addEventListener('focus', showCalendar);
    input.addEventListener('click', showCalendar);
    icon.addEventListener('click', function(e) {
        e.preventDefault();
        showCalendar();
        input.focus();
    });
    // Keyboard navigation: close on Esc
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') hideCalendar();
    });
    // Prevent manual typing
    input.addEventListener('keydown', function(e) { e.preventDefault(); });
})();

// Utility functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatPhone(phone) {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}

// Helper function to format occupation display
function formatOccupation(occupation, suboccupation) {
    if (!occupation) return 'N/A';
    
    let formattedOccupation = '';
    
    // Format primary occupation
    if (occupation === 'technical') {
        formattedOccupation = 'Soldier';
    } else if (occupation === 'nonTechnical') {
        formattedOccupation = 'Officer';
    } else {
        formattedOccupation = occupation; // Fallback to whatever was stored
    }
      // Add suboccupation if available
    if (suboccupation) {
        // Get display text from role mapping
        const roleMap = {
            // Soldier degrees (N.Z 1-10)
            'rank1': 'N.Z 1',
            'rank2': 'N.Z 2',
            'rank3': 'N.Z 3',
            'rank4': 'N.Z 4',
            'rank5': 'N.Z 5',
            'rank6': 'N.Z 6',
            'rank7': 'N.Z 7',
            'rank8': 'N.Z 8',
            'rank9': 'N.Z 9',
            'rank10': 'N.Z 10',
            
            // Officer degrees (Arabic ranks)
            'mlazm': 'Mlazm',
            'mlazmAwal': 'Mlazm Awal',
            'naqib': 'Naqib',
            'rayd': 'Rayd',
            'muqadam': 'Muqadam',
            'aqid': '3aqid',
            'amid': '3amid',
            'liwa': 'Liwa'
        };
        
        // Get the formatted suboccupation from the map, or use the original value if not found
        const formattedSuboccupation = roleMap[suboccupation] || suboccupation;
        
        return `${formattedOccupation}: ${formattedSuboccupation}`;
    }
    
    return formattedOccupation;
}

// Debug helper function
function toggleDebugInfo() {
    const debugEl = document.getElementById('debug-info');
    if (!debugEl) return;
    
    if (debugEl.style.display === 'none') {
        // Show debug info
        debugEl.style.display = 'block';
        
        // Gather debug information
        const firebaseStatus = typeof FirebaseHelper !== 'undefined' && 
            FirebaseHelper.isAvailable && FirebaseHelper.isAvailable() 
            ? 'Connected' : 'Not connected';
        
        const storedUsers = localStorage.getItem('users');
        const lsUserCount = storedUsers ? JSON.parse(storedUsers).length : 0;
        
        const debugInfo = `
            <h4>Debug Information</h4>
            <p><strong>Firebase:</strong> ${firebaseStatus}</p>
            <p><strong>Memory User Count:</strong> ${users.length}</p>
            <p><strong>localStorage User Count:</strong> ${lsUserCount}</p>
            <p><strong>Last Error:</strong> <span id="last-error">None</span></p>
            <button onclick="addSampleData(); forceInitDashboard();" class="btn btn-secondary" style="background: #8e44ad;">
                Regenerate Sample Data
            </button>
        `;
        
        debugEl.innerHTML = debugInfo;
    } else {
        debugEl.style.display = 'none';
    }
}

// Show debug info when clicking stats card
document.addEventListener('DOMContentLoaded', function() {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards) {
        statCards.forEach(card => {
            card.addEventListener('dblclick', toggleDebugInfo);
        });
    }
});

// Add some sample data for demonstration (runs only once)
function addSampleData() {
    console.log('Adding sample data');    const sampleUsers = [
        {
            id: 'user_sample_1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            dateOfBirth: '1990-05-15',
            gender: 'male',
            address: '123 Main Street',
            city: 'New York',            occupation: 'technical',
            suboccupation: 'rank3',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 'user_sample_2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 987-6543',
            dateOfBirth: '1985-09-22',
            gender: 'female',
            address: '456 Oak Avenue',
            city: 'Los Angeles',            occupation: 'nonTechnical',
            suboccupation: 'naqib',
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ];
    
    // Update the global users array
    users = sampleUsers;
    
    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log('Sample data added:', users.length, 'users');
    
    // Try to save to Firebase if available
    if (typeof FirebaseHelper !== 'undefined' && FirebaseHelper.isAvailable && FirebaseHelper.isAvailable()) {
        console.log('Attempting to add sample users to Firebase...');
        try {
            sampleUsers.forEach(async (user) => {
                try {
                    await FirebaseHelper.addUser(user);
                } catch (e) {
                    console.warn('Could not add sample user to Firebase:', e);
                }
            });
        } catch (e) {
            console.error('Error adding sample data to Firebase:', e);
        }
    }
    
    return users;
}

// Helper function to forcefully initialize the dashboard
async function forceInitDashboard() {
    try {
        console.log('Force dashboard initialization started');
        
        // Make sure users are loaded
        if (users.length === 0) {
            console.log('Users array empty, loading from storage');
            users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.length === 0) {
                console.log('Still no users found, adding sample data');
                addSampleData();
            }
        }
        
        console.log('Users available for display:', users.length);
        
        // Update stats first
        updateStats();
        
        // Then display users
        displayUsers();
        
        console.log('Force dashboard initialization completed');
    } catch (error) {
        console.error('Error during force initialization:', error);
    }
}

// Function to handle the occupation subdropdown
function showSuboccupation() {
    const occupationSelect = document.getElementById('occupation');
    const suboccupationContainer = document.getElementById('suboccupationContainer');
    const suboccupationSelect = document.getElementById('suboccupation');
    const suboccupationHint = document.getElementById('suboccupationHint');
    let occupationValue = '';
    
    try {
        // If any required element is missing, log error and return
        if (!occupationSelect) {
            console.error('Missing occupation select element');
            return;
        }
        
        if (!suboccupationContainer || !suboccupationSelect) {
            console.error('Missing suboccupation container or select element');
            return;
        }
        
        occupationValue = occupationSelect.value;
        
        // Clear previous options
        suboccupationSelect.innerHTML = '';
          
        if (!occupationValue) {
            if (suboccupationContainer.classList.contains('visible')) {
                suboccupationContainer.classList.remove('visible');
                // Hide after animation completes
                setTimeout(() => {
                    suboccupationContainer.style.display = 'none';
                }, 300);
            } else {
                suboccupationContainer.style.display = 'none';
            }
            return;
        }
          
        // Show the suboccupation dropdown with animation
        suboccupationContainer.style.display = 'block';
        // Use setTimeout to allow the display:block to take effect before adding the visible class
        setTimeout(() => {
            if (suboccupationContainer) {
                suboccupationContainer.classList.add('visible');
            }
        }, 10);
    } catch (err) {
        console.error('Error in showSuboccupation function:', err);
        // If there's an error, we'll return to avoid processing further
        return;
    }
      if (occupationValue === 'technical') {
        // Update hint text for soldier degrees
        if (suboccupationHint) {
            suboccupationHint.textContent = 'Select a soldier degree';
        }
          // Add soldier degree options with numeric ranks (1-10)
        const technicalRoles = [
            { value: '', text: 'Select Soldier Degree' },
            { value: 'rank1', text: 'N.Z 1' },
            { value: 'rank2', text: 'N.Z 2' },
            { value: 'rank3', text: 'N.Z 3' },
            { value: 'rank4', text: 'N.Z 4' },
            { value: 'rank5', text: 'N.Z 5' },
            { value: 'rank6', text: 'N.Z 6' },
            { value: 'rank7', text: 'N.Z 7' },
            { value: 'rank8', text: 'N.Z 8' },
            { value: 'rank9', text: 'N.Z 9' },
            { value: 'rank10', text: 'N.Z 10' }
        ];
        
        technicalRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.value;
            option.textContent = role.text;
            suboccupationSelect.appendChild(option);
        });    } else if (occupationValue === 'nonTechnical') {
        // Update hint text for officer degrees
        if (suboccupationHint) {
            suboccupationHint.textContent = 'Select an officer degree';
        }
          // Add officer degree options with Arabic ranks
        const nonTechnicalRoles = [
            { value: '', text: 'Select Officer Degree' },
            { value: 'mlazm', text: 'Mlazm' },
            { value: 'mlazmAwal', text: 'Mlazm Awal' },
            { value: 'naqib', text: 'Naqib' },
            { value: 'rayd', text: 'Rayd' },
            { value: 'muqadam', text: 'Muqadam' },
            { value: 'aqid', text: '3aqid' },
            { value: 'amid', text: '3amid' },
            { value: 'liwa', text: 'Liwa' }
        ];
        
        nonTechnicalRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.value;
            option.textContent = role.text;
            suboccupationSelect.appendChild(option);
        });
    }
}

// Function to migrate any legacy data format to the new format
function migrateUserData() {
    try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            let parsedUsers = JSON.parse(storedUsers);
            let dataUpdated = false;
            
            parsedUsers = parsedUsers.map(user => {
                // Handle occupation field changes
                if (typeof user.occupation === 'string') {
                    // Check if it's already in the new format
                    if (user.occupation !== 'technical' && user.occupation !== 'nonTechnical') {                        // Try to determine the category based on old occupation
                        const technicalOccupations = [
                            'soldier', 'Soldier', 'N.Z', 'private', 'corporal', 'sergeant',
                            'rank1', 'rank2', 'rank3', 'rank4', 'rank5',
                            'rank6', 'rank7', 'rank8', 'rank9', 'rank10'
                        ];
                        
                        if (technicalOccupations.some(term => 
                            user.occupation.toLowerCase().includes(term.toLowerCase()))) {
                            // Set suboccupation to original value if appropriate
                            user.suboccupation = user.occupation;
                            user.occupation = 'technical';
                            dataUpdated = true;
                        } else {
                            // Default to non-technical
                            user.suboccupation = user.occupation;
                            user.occupation = 'nonTechnical';
                            dataUpdated = true;
                        }
                    }
                }
                
                // Remove deprecated zipCode field
                if (user.zipCode) {
                    delete user.zipCode;
                    dataUpdated = true;
                }
                
                return user;
            });
            
            if (dataUpdated) {
                console.log('User data migrated to new format');
                localStorage.setItem('users', JSON.stringify(parsedUsers));
                users = parsedUsers; // Update the global users array
            }
        }
    } catch (error) {
        console.error('Error migrating user data:', error);
    }
}

// Run data migration when page loads
document.addEventListener('DOMContentLoaded', function() {
    migrateUserData();
});

// Search and filter functionality
function initSearchAndFilter() {
    // Check if search and filter elements exist (they only exist on index.html)
    const searchInput = document.getElementById('userSearch');
    const rankFilter = document.getElementById('rankFilter');
    
    if (searchInput && rankFilter) {
        console.log('Search and filter initialized');
        
        // Add event listeners
        searchInput.addEventListener('keyup', filterUsers);
        rankFilter.addEventListener('change', filterUsers);
    }
}

function filterUsers() {
    const searchInput = document.getElementById('userSearch');
    const rankFilter = document.getElementById('rankFilter');
    const userRows = document.querySelectorAll('.user-table tbody tr');
    
    if (!searchInput || !rankFilter || !userRows.length) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const rankFilterValue = rankFilter.value;
    
    let foundAnyMatch = false;
    
    userRows.forEach(row => {
        const userName = row.querySelector('.user-name-cell').textContent.toLowerCase();
        const userEmail = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const userOccupation = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
        
        // Check if row matches search term
        const matchesSearch = searchTerm === '' || 
            userName.includes(searchTerm) || 
            userEmail.includes(searchTerm) || 
            userOccupation.includes(searchTerm);
        
        // Check if row matches rank filter
        let matchesRank = true;
        if (rankFilterValue !== 'all') {
            if (rankFilterValue === 'technical') {
                matchesRank = userOccupation.includes('soldier');
            } else if (rankFilterValue === 'nonTechnical') {
                matchesRank = userOccupation.includes('officer');
            }
        }
        
        // Show or hide row based on filters
        if (matchesSearch && matchesRank) {
            row.classList.remove('filtered-out');
            foundAnyMatch = true;
        } else {
            row.classList.add('filtered-out');
        }
    });
    
    // Show or hide the "no results" message
    displayNoResultsMessage(!foundAnyMatch);
}

function displayNoResultsMessage(show) {
    let noResultsEl = document.getElementById('noResultsMessage');
    const userGrid = document.getElementById('userGrid');
    const tableExists = userGrid && userGrid.querySelector('table');
    
    // Only proceed if there's a table (meaning we have users)
    if (!tableExists) return;
    
    if (show) {
        // Create the message if it doesn't exist
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.id = 'noResultsMessage';
            noResultsEl.className = 'no-results';
            noResultsEl.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No Matching Results</h3>
                <p>Try adjusting your search term or filter.</p>
            `;
            userGrid.appendChild(noResultsEl);
        } else {
            noResultsEl.style.display = 'block';
        }
    } else if (noResultsEl) {
        // Hide the message if it exists
        noResultsEl.style.display = 'none';
    }
}

// Debug function to trace user IDs
function debugUserIds() {
    console.group("User ID Debug Information");
    console.log("Total users:", users.length);
    users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            idType: typeof user.id
        });
    });
    console.groupEnd();
}

// Add debug button to the interface
function addDebugButton() {
    const buttonContainer = document.querySelector('.btn-group');
    if (buttonContainer) {
        const debugButton = document.createElement('button');
        debugButton.className = 'btn btn-secondary';
        debugButton.style.background = '#9b59b6';
        debugButton.style.color = '#fff';
        debugButton.innerHTML = '<i class="fas fa-bug"></i> Debug';
        debugButton.onclick = function() {
            debugUserIds();
            alert("Check console for user ID debug information");
        };
        buttonContainer.appendChild(debugButton);
    }
}

// Add debug button on page load
// document.addEventListener('DOMContentLoaded', addDebugButton);

// Global error handler for Firebase operations
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Add to debug panel if it exists
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.style.display = 'block';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${event.reason.message || 'Unknown error'} 
            <button onclick="this.parentNode.remove()" class="btn-close">×</button>
        `;
        debugInfo.appendChild(errorDiv);
    }
});

// Add a test user to help with debugging
async function addTestUser() {
    try {
        const today = new Date();
        const testUser = {
            firstName: 'Test',
            lastName: 'User_' + Math.floor(Math.random() * 1000),
            email: 'test' + Date.now() + '@example.com',
            phone: '123-456-7890',
            dateOfBirth: new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()).toISOString().split('T')[0],
            gender: 'male',
            address: '123 Test Street',
            city: 'Test City',
            occupation: 'technical',
            suboccupation: 'rank3',
            status: 'active'
        };
        
        const savedUser = await DataManager.saveUser(testUser);
        console.log('Added test user:', savedUser);
        alert('Test user added successfully');
        
        // Refresh the dashboard
        initDashboard();
    } catch (error) {
        console.error('Error adding test user:', error);
        alert('Error adding test user: ' + error.message);
    }
}
