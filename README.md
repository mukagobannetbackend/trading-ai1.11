# Trading Journal AI - Python/Flask Edition

A professional trading journal and analysis platform built with Python Flask, HTML5, CSS3, and JavaScript. Features email-based verification authentication, automated trade journaling, AI-powered analysis, and advanced analytics.

## Features

### Core Features
- **Email Verification Authentication** - 6-digit verification codes sent to user emails
- **Pullback Entry Model Checklist** - HTF direction, swing range, BOS/MSS detection, liquidity sweeps
- **ProTrend Entry Model Checklist** - Trend confirmation, swing range, POI reaction detection
- **Trade Journal** - Log trades with entry/exit details, results, and notes
- **Screenshot Analysis** - AI-powered detection of MSS, FVG, liquidity sweeps, HTF bias
- **Analytics Dashboard** - Win rate tracking, pair performance, model comparison
- **Behavior Insights** - Trading pattern analysis and consistency scoring
- **Overtrading Protection** - Max 2 trades per day with real-time alerts
- **Monthly Reports** - Downloadable performance summaries

### Design
- **Dark Theme** - Modern, professional dark interface with bright text
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Professional micro-interactions and transitions
- **Sidebar Navigation** - Easy access to all features
- **Real-time Updates** - Instant feedback on all actions

## Tech Stack

- **Backend**: Python 3.11+, Flask 3.0
- **Database**: SQLite (SQLAlchemy ORM)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Email**: Flask-Mail with SMTP
- **Authentication**: Email verification codes

## Installation

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)

### Setup Steps

1. **Clone the repository**
```bash
cd /home/ubuntu/trading-journal-ai
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your email configuration:
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

5. **Initialize database**
```bash
python3
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

6. **Run the application**
```bash
python3 app.py
```

The app will be available at `http://localhost:5000`

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env` as `MAIL_PASSWORD`

### Other Email Providers
Update `.env` with your provider's SMTP settings:
- **Outlook**: smtp.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:465 (use TLS=False)
- **SendGrid**: smtp.sendgrid.net:587

## Project Structure

```
trading-journal-ai/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── models.py             # Database models
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
├── templates/
│   ├── index.html        # Login/verification page
│   └── dashboard.html    # Main dashboard
├── static/
│   ├── css/
│   │   ├── style.css     # Main styles
│   │   └── dashboard.css # Dashboard styles
│   └── js/
│       ├── auth.js       # Authentication logic
│       ├── main.js       # Main app logic
│       └── dashboard.js  # Dashboard functionality
└── uploads/              # Screenshot uploads
```

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code to email
- `POST /api/auth/verify-code` - Verify code and create session
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Trades
- `GET /api/trades` - Get all trades
- `POST /api/trades` - Create new trade

### Analytics
- `GET /api/analytics/win-rate` - Get win rate
- `GET /api/analytics/model-comparison` - Compare entry models

### Checklists
- `POST /api/pullback-checklist` - Submit Pullback checklist
- `POST /api/protrend-checklist` - Submit ProTrend checklist

### Screenshots
- `POST /api/screenshot` - Upload and analyze screenshot

## Usage

### Login Flow
1. Enter your email address
2. Receive 6-digit verification code
3. Enter code and optional name
4. Access dashboard

### Logging a Trade
1. Navigate to "Pullback Model" or "ProTrend Model"
2. Complete the checklist items
3. Fill in trade details (prices, direction, etc.)
4. Submit to get efficiency score

### Analyzing Screenshots
1. Go to "Screenshot Review"
2. Upload a chart image
3. AI analyzes for MSS, FVG, liquidity sweeps, HTF bias
4. View detailed analysis results

### Viewing Analytics
1. Go to "Analytics" page
2. See win rate, model comparison, pair performance
3. Track consistency and behavior patterns

## Customization

### Styling
- Edit `static/css/style.css` for global styles
- Edit `static/css/dashboard.css` for dashboard-specific styles
- Colors defined in CSS variables (`:root` section)

### Email Templates
Modify email templates in `app.py` `send_verification_code()` function

### Database
Add new tables in `models.py` and run migrations

## Troubleshooting

### Email not sending
- Check `.env` configuration
- Verify SMTP credentials
- Check email provider's app password requirements
- Look at Flask-Mail logs for errors

### Database errors
- Delete `trading_journal.db` and reinitialize
- Check SQLAlchemy model definitions
- Verify database permissions

### Authentication issues
- Clear browser cookies
- Check session configuration in `config.py`
- Verify SECRET_KEY is set

## Performance Tips

- Use production WSGI server (Gunicorn) for deployment
- Enable database indexing for large datasets
- Implement caching for analytics queries
- Use CDN for static files in production

## Security Recommendations

- Change `SECRET_KEY` in production
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Add CSRF protection
- Validate all user inputs
- Use environment variables for sensitive data

## Deployment

### Local Development
```bash
python3 app.py
```

### Production (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

## License

MIT License - Feel free to use for personal or commercial projects

## Support

For issues or questions, refer to the documentation or check the code comments.

## Future Enhancements

- Real-time notifications
- Advanced charting integration
- Mobile app
- Social features
- API for third-party integrations
- Machine learning for trade prediction
- Automated backup and export
