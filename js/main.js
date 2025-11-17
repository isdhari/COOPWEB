// ============ API Base URL ============
const API_BASE_URL = 'http://localhost:3000/api';

// ============ Load Statistics ============
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const data = await response.json();
        
        document.getElementById('volunteers-count').textContent = data.volunteersCount || 0;
        document.getElementById('organizations-count').textContent = data.organizationsCount || 0;
        document.getElementById('opportunities-count').textContent = data.opportunitiesCount || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ============ Load Opportunities ============
async function loadOpportunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/opportunities`);
        const opportunities = await response.json();
        
        const container = document.getElementById('opportunities-container');
        if (!container) return;
        
        if (opportunities.length === 0) {
            container.innerHTML = '<p class="text-center">لا توجد فرص تطوع حالياً</p>';
            return;
        }
        
        container.innerHTML = opportunities.map(opp => `
            <div class="card">
                <div class="card-body">
                    <h3>${opp.title}</h3>
                    <p><strong>المجال:</strong> ${opp.field}</p>
                    <p><strong>المدينة:</strong> ${opp.city}</p>
                    <p><strong>عدد المتطوعين المطلوبين:</strong> ${opp.volunteersNeeded}</p>
                    <p>${opp.description}</p>
                    <div style="display: flex; gap: 1rem;">
                        <a href="opportunity-detail.html?id=${opp.id}" class="btn btn-primary">عرض التفاصيل</a>
                        <button onclick="applyForOpportunity(${opp.id})" class="btn btn-primary" style="background-color: #4a9b8e;">التقديم على الفرصة</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading opportunities:', error);
    }
}

// ============ Load Opportunity Details ============
async function loadOpportunityDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/opportunities/${id}`);
        const opportunity = await response.json();
        
        const container = document.getElementById('opportunity-detail');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h2>${opportunity.title}</h2>
                    <p><strong>الجهة:</strong> ${opportunity.organizationName}</p>
                    <p><strong>المجال:</strong> ${opportunity.field}</p>
                    <p><strong>المدينة:</strong> ${opportunity.city}</p>
                    <p><strong>تاريخ البداية:</strong> ${new Date(opportunity.startDate).toLocaleDateString('ar-SA')}</p>
                    <p><strong>تاريخ النهاية:</strong> ${new Date(opportunity.endDate).toLocaleDateString('ar-SA')}</p>
                    <p><strong>عدد المتطوعين المطلوبين:</strong> ${opportunity.volunteersNeeded}</p>
                    <p><strong>المتطلبات:</strong> ${opportunity.requirements}</p>
                    <h4>الوصف:</h4>
                    <p>${opportunity.description}</p>
                    <a href="volunteer-register.html" class="btn btn-primary">تقدم الآن</a>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading opportunity details:', error);
    }
}

// ============ Submit Volunteer Form ============
async function submitVolunteerForm(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const city = document.getElementById('city').value;
    const skills = document.getElementById('skills').value;
    const interests = document.getElementById('interests').value;
    const experience = document.getElementById('experience').value;
    
    if (!fullName || !email || !phone || !city || !skills || !interests) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const formData = {
        fullName: fullName,
        email: email,
        phone: phone,
        city: city,
        skills: skills,
        interests: interests,
        experience: experience
    };
    
    console.log('📤 Submitting volunteer form:', formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/volunteers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showMessage('تم التسجيل بنجاح! شكراً لانضمامك إلينا', 'success');
            document.getElementById('volunteerForm').reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(responseData.error || 'حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى', 'error');
        }
    } catch (error) {
        console.error('Error submitting volunteer form:', error);
        showMessage('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    }
}

// ============ Submit Organization Form ============
async function submitOrganizationForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('orgName').value;
    const email = document.getElementById('orgEmail').value;
    const phone = document.getElementById('orgPhone').value;
    const city = document.getElementById('orgCity').value;
    const type = document.getElementById('orgType').value;
    const description = document.getElementById('orgDescription').value;
    const website = document.getElementById('orgWebsite').value;
    
    if (!name || !email || !phone || !city || !type || !description) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const formData = {
        name: name,
        email: email,
        phone: phone,
        city: city,
        type: type,
        description: description,
        website: website
    };
    
    console.log('📤 Submitting organization form:', formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/organizations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showMessage('تم تسجيل جهتك بنجاح! شكراً لانضمامك إلينا', 'success');
            document.getElementById('organizationForm').reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(responseData.error || 'حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى', 'error');
        }
    } catch (error) {
        console.error('Error submitting organization form:', error);
        showMessage('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    }
}

// ============ Submit Contact Form ============
async function submitContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    if (!name || !email || !subject || !message) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const formData = {
        name: name,
        email: email,
        subject: subject,
        message: message
    };
    
    console.log('📤 Submitting contact form:', formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showMessage('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً', 'success');
            document.getElementById('contactForm').reset();
        } else {
            showMessage(responseData.error || 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى', 'error');
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showMessage('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    }
}

// ============ Show Message ============
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-in-out;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ============ Submit Opportunity Form ============
async function submitOpportunityForm(event) {
    event.preventDefault();
    
    const orgId = document.getElementById('orgId').value;
    const title = document.getElementById('title').value;
    const field = document.getElementById('field').value;
    const city = document.getElementById('city').value;
    const description = document.getElementById('description').value;
    const volunteersNeeded = document.getElementById('volunteersNeeded').value;
    const requirements = document.getElementById('requirements').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!orgId || !title || !field || !city || !description || !volunteersNeeded || !requirements || !startDate || !endDate) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const formData = {
        organizationId: parseInt(orgId),
        title: title,
        field: field,
        city: city,
        description: description,
        volunteersNeeded: parseInt(volunteersNeeded),
        requirements: requirements,
        startDate: startDate,
        endDate: endDate,
        status: 'active'
    };
    
    console.log('📤 Submitting opportunity form:', formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/opportunities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            // Save volunteer session
            localStorage.setItem('volunteerId', response.json().id);
            localStorage.setItem('userType', 'volunteer');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');
            
            showMessage('تم التسجيل بنجاح!', 'success');
            document.getElementById('volunteerForm').reset();
            setTimeout(() => {
                updateNavbar();
                window.location.href = 'opportunities.html';
            }, 2000);
        } else {
            showMessage(responseData.error || 'حدث خطأ في إضافة الفرصة. يرجى المحاولة مرة أخرى', 'error');
        }
    } catch (error) {
        console.error('Error submitting opportunity form:', error);
        showMessage('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    }
}

// ============ Apply for Opportunity ============
async function applyForOpportunity(opportunityId) {
    const volunteerId = prompt('أدخل معرف المتطوع الخاص بك:');
    
    if (!volunteerId) {
        showMessage('يرجى إدخال معرف المتطوع', 'error');
        return;
    }
    
    const formData = {
        volunteerId: parseInt(volunteerId),
        opportunityId: parseInt(opportunityId)
    };
    
    console.log('📤 Applying for opportunity:', formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (response.ok) {
            showMessage('تم التقديم بنجاح! شكراً لك', 'success');
        } else {
            showMessage(responseData.error || 'حدث خطأ في التقديم. يرجى المحاولة مرة أخرى', 'error');
        }
    } catch (error) {
        console.error('Error applying for opportunity:', error);
        showMessage('خطأ في الاتصال بالخادم: ' + error.message, 'error');
    }
}

// ============ User Authentication ============
function loginVolunteer(email, password) {
    console.log('🔐 Logging in volunteer:', email);
    // Store volunteer session
    localStorage.setItem('userType', 'volunteer');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    updateNavbar();
}

function loginOrganization(email, password) {
    console.log('🔐 Logging in organization:', email);
    // Store organization session
    localStorage.setItem('userType', 'organization');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    updateNavbar();
}

function logout() {
    console.log('👋 Logging out');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('orgId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('volunteerId');
    localStorage.removeItem('isLoggedIn');
    updateNavbar();
    window.location.href = 'index.html';
}

function updateNavbar() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userType = localStorage.getItem('userType');
    const userEmail = localStorage.getItem('userEmail');
    
    const navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) return;
    
    if (isLoggedIn) {
        navButtons.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span style="color: white; font-size: 0.9rem;">${userEmail}</span>
                <button onclick="goToProfile()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">البروفايل</button>
                ${userType === 'organization' ? '<button onclick="goToDashboard()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">لوحة التحكم</button>' : ''}
                <button onclick="logout()" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.9rem;">تسجيل خروج</button>
            </div>
        `;
    } else {
        navButtons.innerHTML = `
            <a href="volunteer-register.html" class="btn btn-secondary">سجل كمتطوع</a>
            <a href="organization-register.html" class="btn btn-outline">سجل جهتك</a>
        `;
    }
}

function goToProfile() {
    const userType = localStorage.getItem('userType');
    if (userType === 'volunteer') {
        window.location.href = 'volunteer-profile.html';
    } else if (userType === 'organization') {
        window.location.href = 'organization-profile.html';
    }
}

function goToDashboard() {
    window.location.href = 'organization-dashboard.html';
}

// ============ Initialize Page ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Page loaded, initializing...');
    
    updateNavbar();
    loadStatistics();
    loadOpportunities();
    loadOpportunityDetails();
    
    // Attach form handlers
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        console.log('✅ Volunteer form found');
        volunteerForm.addEventListener('submit', submitVolunteerForm);
    }
    
    const organizationForm = document.getElementById('organizationForm');
    if (organizationForm) {
        console.log('✅ Organization form found');
        organizationForm.addEventListener('submit', submitOrganizationForm);
    }
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        console.log('✅ Contact form found');
        contactForm.addEventListener('submit', submitContactForm);
    }
    
    const opportunityForm = document.getElementById('opportunityForm');
    if (opportunityForm) {
        console.log('✅ Opportunity form found');
        opportunityForm.addEventListener('submit', submitOpportunityForm);
    }
});

// ============ CSS Animation ============
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
