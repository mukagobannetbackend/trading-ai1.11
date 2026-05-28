// ==================== AUTH STATE ====================
let authState = {
    email: '',
    code: '',
    timerInterval: null,
    timeRemaining: 600
};

// ==================== EMAIL SUBMISSION ====================
async function handleEmailSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');
    
    // Clear messages
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');
    
    if (!email) {
        showError('Please enter your email');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authState.email = email;
            
            // Show success message
            showSuccess('Verification code sent! Check your email.');
            
            // Switch to code step
            setTimeout(() => {
                document.getElementById('email-step').classList.remove('active');
                document.getElementById('code-step').classList.add('active');
                document.getElementById('display-email').textContent = email;
                
                // Start timer
                startCodeTimer();
            }, 1500);
        } else {
            showError(data.error || 'Failed to send verification code');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    }
}

// ==================== CODE VERIFICATION ====================
async function handleCodeSubmit(event) {
    event.preventDefault();
    
    const code = document.getElementById('verification-code').value.trim();
    const name = document.getElementById('user-name').value.trim();
    const errorMsg = document.getElementById('error-message');
    
    errorMsg.classList.remove('show');
    
    if (!code || code.length !== 6) {
        showError('Please enter a valid 6-digit code');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: authState.email,
                code: code,
                name: name
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Email verified! Redirecting to dashboard...');
            clearInterval(authState.timerInterval);
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showError(data.error || 'Verification failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    }
}

// ==================== RESEND CODE ====================
async function resendCode() {
    const email = authState.email;
    
    if (!email) {
        showError('Email not found');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showSuccess('New code sent to your email!');
            
            // Reset timer
            clearInterval(authState.timerInterval);
            authState.timeRemaining = 600;
            startCodeTimer();
        } else {
            showError('Failed to resend code');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error');
    }
}

// ==================== GO BACK TO EMAIL ====================
function goBackToEmail() {
    clearInterval(authState.timerInterval);
    document.getElementById('code-step').classList.remove('active');
    document.getElementById('email-step').classList.add('active');
    document.getElementById('email').value = authState.email;
    document.getElementById('verification-code').value = '';
    document.getElementById('user-name').value = '';
}

// ==================== TIMER ====================
function startCodeTimer() {
    authState.timeRemaining = 600; // 10 minutes
    
    authState.timerInterval = setInterval(() => {
        authState.timeRemaining--;
        
        const minutes = Math.floor(authState.timeRemaining / 60);
        const seconds = authState.timeRemaining % 60;
        
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (authState.timeRemaining <= 0) {
            clearInterval(authState.timerInterval);
            showError('Verification code expired. Please request a new one.');
            goBackToEmail();
        }
    }, 1000);
}

// ==================== MESSAGE HELPERS ====================
function showError(message) {
    const errorMsg = document.getElementById('error-message');
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successMsg = document.getElementById('success-message');
    successMsg.textContent = message;
    successMsg.classList.add('show');
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 5000);
}

// ==================== CHECK AUTH ON PAGE LOAD ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.user) {
            // User is already logged in, redirect to dashboard
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
});
