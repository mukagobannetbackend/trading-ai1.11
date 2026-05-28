from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from flask_mail import Mail, Message
from config import config
from models import db, User, TradeJournal, PullbackChecklist, ProntrendChecklist, Screenshot, DailyTradeCounter, MonthlyReport
from datetime import datetime, timedelta, date
from functools import wraps
import os
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    mail = Mail(app)
    CORS(app, supports_credentials=True)
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    with app.app_context():
        db.create_all()
    
    # ==================== AUTHENTICATION ROUTES ====================
    
    @app.route('/api/auth/send-code', methods=['POST'])
    def send_verification_code():
        """Send verification code to email"""
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        try:
            user = User.query.filter_by(email=email).first()
            
            if not user:
                # Create new user
                user = User(email=email)
                db.session.add(user)
                db.session.commit()
            
            # Generate verification code
            code = user.generate_verification_code()
            db.session.commit()
            
            # Send email
            try:
                msg = Message(
                    subject='Your Trading Journal AI Verification Code',
                    recipients=[email],
                    html=f'''
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">Trading Journal AI</h2>
                        <p>Your verification code is:</p>
                        <h1 style="color: #3b82f6; letter-spacing: 5px; font-size: 32px;">{code}</h1>
                        <p style="color: #666;">This code expires in 10 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                    '''
                )
                mail.send(msg)
            except Exception as e:
                print(f"Email send error: {e}")
                return jsonify({'error': 'Failed to send verification code'}), 500
            
            return jsonify({'success': True, 'message': 'Verification code sent to email'}), 200
        
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': 'Server error'}), 500
    
    @app.route('/api/auth/verify-code', methods=['POST'])
    def verify_code():
        """Verify the code and create session"""
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        code = data.get('code', '').strip()
        name = data.get('name', '').strip()
        
        if not email or not code:
            return jsonify({'error': 'Email and code required'}), 400
        
        try:
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            success, message = user.verify_code(code)
            
            if success:
                if name and not user.name:
                    user.name = name
                db.session.commit()
                
                session['user_id'] = user.id
                session['email'] = user.email
                session.permanent = True
                
                return jsonify({'success': True, 'message': message}), 200
            else:
                db.session.commit()
                return jsonify({'error': message}), 400
        
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': 'Server error'}), 500
    
    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        """Logout user"""
        session.clear()
        return jsonify({'success': True}), 200
    
    @app.route('/api/auth/me', methods=['GET'])
    def get_current_user():
        """Get current user info"""
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'user': None}), 200
        
        try:
            user = User.query.get(user_id)
            if user:
                return jsonify({
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'name': user.name,
                        'is_verified': user.is_verified
                    }
                }), 200
            else:
                session.clear()
                return jsonify({'user': None}), 200
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': 'Server error'}), 500
    
    # ==================== HELPER FUNCTION ====================
    
    def login_required(f):
        """Decorator to check if user is logged in"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            return f(*args, **kwargs)
        return decorated_function
    
    # ==================== TRADE JOURNAL ROUTES ====================
    
    @app.route('/api/trades', methods=['GET'])
    @login_required
    def get_trades():
        """Get all trades for user"""
        user_id = session.get('user_id')
        trades = TradeJournal.query.filter_by(user_id=user_id).order_by(TradeJournal.created_at.desc()).all()
        
        return jsonify({
            'trades': [{
                'id': t.id,
                'currency_pair': t.currency_pair,
                'model_used': t.model_used,
                'entry_price': t.entry_price,
                'exit_price': t.exit_price,
                'entry_time': t.entry_time.isoformat() if t.entry_time else None,
                'exit_time': t.exit_time.isoformat() if t.exit_time else None,
                'result': t.result,
                'pips_gained': t.pips_gained,
                'notes': t.notes,
                'ai_journal': t.ai_journal,
                'efficiency_score': t.efficiency_score,
                'created_at': t.created_at.isoformat()
            } for t in trades]
        }), 200
    
    @app.route('/api/trades', methods=['POST'])
    @login_required
    def create_trade():
        """Create new trade"""
        user_id = session.get('user_id')
        data = request.get_json()
        
        try:
            trade = TradeJournal(
                user_id=user_id,
                currency_pair=data.get('currency_pair'),
                model_used=data.get('model_used'),
                entry_price=data.get('entry_price'),
                exit_price=data.get('exit_price'),
                entry_time=datetime.fromisoformat(data.get('entry_time')) if data.get('entry_time') else None,
                exit_time=datetime.fromisoformat(data.get('exit_time')) if data.get('exit_time') else None,
                result=data.get('result'),
                pips_gained=data.get('pips_gained'),
                notes=data.get('notes'),
                ai_journal=data.get('ai_journal'),
                efficiency_score=data.get('efficiency_score', 0)
            )
            
            db.session.add(trade)
            db.session.commit()
            
            # Update daily counter
            today = date.today()
            counter = DailyTradeCounter.query.filter_by(user_id=user_id, trade_date=today).first()
            if not counter:
                counter = DailyTradeCounter(user_id=user_id, trade_date=today)
                db.session.add(counter)
            counter.trade_count += 1
            db.session.commit()
            
            return jsonify({'success': True, 'trade_id': trade.id}), 201
        
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': 'Failed to create trade'}), 500
    
    # ==================== ANALYTICS ROUTES ====================
    
    @app.route('/api/analytics/win-rate', methods=['GET'])
    @login_required
    def get_win_rate():
        """Get overall win rate"""
        user_id = session.get('user_id')
        trades = TradeJournal.query.filter_by(user_id=user_id).all()
        
        if not trades:
            return jsonify({'win_rate': 0}), 200
        
        wins = len([t for t in trades if t.result == 'win'])
        win_rate = (wins / len(trades)) * 100
        
        return jsonify({'win_rate': round(win_rate, 2)}), 200
    
    @app.route('/api/analytics/model-comparison', methods=['GET'])
    @login_required
    def get_model_comparison():
        """Get model comparison"""
        user_id = session.get('user_id')
        trades = TradeJournal.query.filter_by(user_id=user_id).all()
        
        pullback_trades = [t for t in trades if t.model_used == 'Pullback Entry Model']
        protrend_trades = [t for t in trades if t.model_used == 'ProTrend Entry Model']
        
        pullback_wr = (len([t for t in pullback_trades if t.result == 'win']) / len(pullback_trades) * 100) if pullback_trades else 0
        protrend_wr = (len([t for t in protrend_trades if t.result == 'win']) / len(protrend_trades) * 100) if protrend_trades else 0
        
        return jsonify({
            'pullback': {'trades': len(pullback_trades), 'win_rate': round(pullback_wr, 2)},
            'protrend': {'trades': len(protrend_trades), 'win_rate': round(protrend_wr, 2)}
        }), 200
    
    # ==================== STATIC FILES ====================
    
    @app.route('/')
    def index():
        """Serve main page"""
        return render_template('index.html')
    
    @app.route('/dashboard')
    def dashboard():
        """Serve dashboard"""
        if not session.get('user_id'):
            return redirect(url_for('index'))
        return render_template('dashboard.html')
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'error': 'Server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000)
