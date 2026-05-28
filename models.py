from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import random
import string

db = SQLAlchemy()

class User(db.Model):
    """User model with email verification"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255))
    password_hash = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(6))
    verification_code_expiry = db.Column(db.DateTime)
    verification_attempts = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trades = db.relationship('TradeJournal', backref='user', lazy=True, cascade='all, delete-orphan')
    pullback_checklists = db.relationship('PullbackChecklist', backref='user', lazy=True, cascade='all, delete-orphan')
    protrend_checklists = db.relationship('ProntrendChecklist', backref='user', lazy=True, cascade='all, delete-orphan')
    screenshots = db.relationship('Screenshot', backref='user', lazy=True, cascade='all, delete-orphan')
    daily_counters = db.relationship('DailyTradeCounter', backref='user', lazy=True, cascade='all, delete-orphan')
    monthly_reports = db.relationship('MonthlyReport', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def generate_verification_code(self):
        """Generate a 6-digit verification code"""
        self.verification_code = ''.join(random.choices(string.digits, k=6))
        self.verification_code_expiry = datetime.utcnow() + timedelta(seconds=600)  # 10 minutes
        self.verification_attempts = 0
        return self.verification_code
    
    def verify_code(self, code):
        """Verify the provided code"""
        if self.verification_attempts >= 5:
            return False, "Too many attempts"
        
        if datetime.utcnow() > self.verification_code_expiry:
            return False, "Code expired"
        
        if self.verification_code == code:
            self.is_verified = True
            self.verification_code = None
            self.verification_code_expiry = None
            return True, "Email verified successfully"
        
        self.verification_attempts += 1
        return False, f"Invalid code. {5 - self.verification_attempts} attempts remaining"

class TradeJournal(db.Model):
    """Trade journal entries"""
    __tablename__ = 'trade_journals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    currency_pair = db.Column(db.String(20), nullable=False)
    model_used = db.Column(db.String(50), nullable=False)  # 'Pullback Entry Model' or 'ProTrend Entry Model'
    entry_price = db.Column(db.Float)
    exit_price = db.Column(db.Float)
    entry_time = db.Column(db.DateTime)
    exit_time = db.Column(db.DateTime)
    result = db.Column(db.String(20))  # 'win', 'loss', 'breakeven'
    pips_gained = db.Column(db.Float)
    notes = db.Column(db.Text)
    ai_journal = db.Column(db.Text)  # AI-generated insights
    efficiency_score = db.Column(db.Float)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PullbackChecklist(db.Model):
    """Pullback Entry Model checklist"""
    __tablename__ = 'pullback_checklists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    currency_pair = db.Column(db.String(20), nullable=False)
    
    # Checklist items
    htf_direction_confirmed = db.Column(db.Boolean, default=False)
    swing_range_marked = db.Column(db.Boolean, default=False)
    bos_mss_identified = db.Column(db.Boolean, default=False)
    candle_marked = db.Column(db.Boolean, default=False)
    liquidity_sweep_detected = db.Column(db.Boolean, default=False)
    entry_zone_identified = db.Column(db.Boolean, default=False)
    
    # Details
    htf_direction = db.Column(db.String(20))  # 'up', 'down'
    swing_high = db.Column(db.Float)
    swing_low = db.Column(db.Float)
    bos_price = db.Column(db.Float)
    mss_price = db.Column(db.Float)
    liquidity_type = db.Column(db.String(20))  # 'buy-side', 'sell-side'
    target_zone = db.Column(db.String(255))
    
    efficiency_score = db.Column(db.Float)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProntrendChecklist(db.Model):
    """ProTrend Entry Model checklist"""
    __tablename__ = 'protrend_checklists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    currency_pair = db.Column(db.String(20), nullable=False)
    
    # Checklist items
    trend_direction_confirmed = db.Column(db.Boolean, default=False)
    swing_range_marked = db.Column(db.Boolean, default=False)
    protected_low_marked = db.Column(db.Boolean, default=False)
    poi_reaction_detected = db.Column(db.Boolean, default=False)
    initial_mitigation_swept = db.Column(db.Boolean, default=False)
    entry_zone_identified = db.Column(db.Boolean, default=False)
    
    # Details
    trend_direction = db.Column(db.String(20))  # 'up', 'down'
    swing_high = db.Column(db.Float)
    swing_low = db.Column(db.Float)
    protected_low = db.Column(db.Float)
    poi_price = db.Column(db.Float)
    mitigation_price = db.Column(db.Float)
    target_zone = db.Column(db.String(255))
    
    efficiency_score = db.Column(db.Float)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Screenshot(db.Model):
    """Screenshot uploads for AI analysis"""
    __tablename__ = 'screenshots'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    currency_pair = db.Column(db.String(20))
    
    # AI Analysis results
    mss_detected = db.Column(db.Boolean, default=False)
    fvg_detected = db.Column(db.Boolean, default=False)
    liquidity_sweep_detected = db.Column(db.Boolean, default=False)
    htf_bias = db.Column(db.String(50))  # 'bullish', 'bearish', 'neutral'
    analysis_notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DailyTradeCounter(db.Model):
    """Track daily trade count for overtrading detection"""
    __tablename__ = 'daily_trade_counters'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    trade_date = db.Column(db.Date, nullable=False)
    trade_count = db.Column(db.Integer, default=0)
    warning_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MonthlyReport(db.Model):
    """Monthly report card"""
    __tablename__ = 'monthly_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    losing_trades = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Float, default=0)
    
    pullback_trades = db.Column(db.Integer, default=0)
    pullback_wins = db.Column(db.Integer, default=0)
    pullback_win_rate = db.Column(db.Float, default=0)
    
    protrend_trades = db.Column(db.Integer, default=0)
    protrend_wins = db.Column(db.Integer, default=0)
    protrend_win_rate = db.Column(db.Float, default=0)
    
    best_pair = db.Column(db.String(20))
    best_pair_win_rate = db.Column(db.Float)
    
    total_pips = db.Column(db.Float, default=0)
    avg_efficiency_score = db.Column(db.Float, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
